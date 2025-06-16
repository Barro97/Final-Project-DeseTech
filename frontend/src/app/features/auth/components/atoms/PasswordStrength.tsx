import React from "react";
import { Check, X, AlertCircle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  type: "length" | "character" | "security";
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
    type: "length",
  },
  {
    label: "Contains uppercase letter",
    test: (password) => /[A-Z]/.test(password),
    type: "character",
  },
  {
    label: "Contains lowercase letter",
    test: (password) => /[a-z]/.test(password),
    type: "character",
  },
  {
    label: "Contains number",
    test: (password) => /\d/.test(password),
    type: "character",
  },
  {
    label: "Contains special character (!@#$%^&*)",
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    type: "character",
  },
  {
    label: "No common passwords",
    test: (password) => !isCommonPassword(password),
    type: "security",
  },
];

// Common weak passwords to check against
const commonPasswords = [
  "password",
  "123456",
  "password123",
  "admin",
  "qwerty",
  "abc123",
  "letmein",
  "welcome",
  "monkey",
  "1234567890",
  "password1",
  "123456789",
  "welcome123",
  "admin123",
  "root",
  "toor",
  "pass",
  "test",
  "guest",
  "user",
  "login",
  "changeme",
  "secret",
  "default",
];

function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(
    (common) => lowerPassword.includes(common) || common.includes(lowerPassword)
  );
}

export function calculatePasswordStrength(password: string): {
  strength: number;
  level: "very-weak" | "weak" | "fair" | "good" | "strong";
  color: string;
} {
  if (!password) {
    return { strength: 0, level: "very-weak", color: "bg-gray-200" };
  }

  const satisfiedRequirements = passwordRequirements.filter((req) =>
    req.test(password)
  );
  const strength =
    (satisfiedRequirements.length / passwordRequirements.length) * 100;

  let level: "very-weak" | "weak" | "fair" | "good" | "strong";
  let color: string;

  if (strength < 20) {
    level = "very-weak";
    color = "bg-red-500";
  } else if (strength < 40) {
    level = "weak";
    color = "bg-red-400";
  } else if (strength < 60) {
    level = "fair";
    color = "bg-yellow-500";
  } else if (strength < 80) {
    level = "good";
    color = "bg-blue-500";
  } else {
    level = "strong";
    color = "bg-green-500";
  }

  return { strength, level, color };
}

export function PasswordStrength({
  password,
  showRequirements = true,
}: PasswordStrengthProps) {
  const { strength, level, color } = calculatePasswordStrength(password);

  const strengthLabels = {
    "very-weak": "Very Weak",
    weak: "Weak",
    fair: "Fair",
    good: "Good",
    strong: "Strong",
  };

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Password strength:</span>
          <span
            className={`font-medium ${
              level === "very-weak" || level === "weak"
                ? "text-red-600"
                : level === "fair"
                  ? "text-yellow-600"
                  : level === "good"
                    ? "text-blue-600"
                    : "text-green-600"
            }`}
          >
            {strengthLabels[level]}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && password && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Password requirements:
          </p>
          <div className="grid grid-cols-1 gap-1 text-sm">
            {passwordRequirements.map((requirement, index) => {
              const satisfied = requirement.test(password);
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 ${
                    satisfied ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {satisfied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>{requirement.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security Warning for Weak Passwords */}
      {password && (level === "very-weak" || level === "weak") && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <p className="font-medium">Weak password detected</p>
            <p>
              Consider using a longer password with a mix of uppercase,
              lowercase, numbers, and symbols.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
