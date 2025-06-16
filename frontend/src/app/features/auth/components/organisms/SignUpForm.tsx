import { ArrowRight, Lock, Mail, User, Building } from "lucide-react";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
import Select from "react-select";
// @ts-expect-error - No types available for react-select-country-list
import countryList from "react-select-country-list";
import { useMemo } from "react";
import Footer from "./Footer";
import FormField from "../molecules/FormField";
import Header from "../molecules/Header";
import { Button } from "@/app/components/atoms/button";
import { CardContent } from "@/app/components/molecules/card";
import { Label } from "../atoms/Label";
import { SignUpData } from "@/app/features/auth/types/authTypes";
import { useSignup } from "../../hooks/useSignup";
import {
  PasswordStrength,
  calculatePasswordStrength,
} from "../atoms/PasswordStrength";

function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    watch,
    setValue,
  } = useForm<SignUpData>();

  const { mutate: signup, isPending } = useSignup();

  const countries = useMemo(() => countryList().getData(), []);
  const password = watch("password");

  // Calculate password strength for validation
  const passwordStrength = password
    ? calculatePasswordStrength(password)
    : null;

  const onSubmit: SubmitHandler<SignUpData> = (data) => {
    signup(data);
  };

  const onError = (errors: FieldErrors<SignUpData>) => {
    console.log("Form validation errors:", errors);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="space-y-2"
      noValidate
    >
      <Header
        title="Create an account"
        description="Enter your information to create an account"
      />
      <CardContent className="space-y-4 pt-0">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <FormField
              label="First name"
              htmlFor="first-name"
              icon={
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              }
              placeholder="John"
              register={register("firstName", {
                required: "First name is required",
                minLength: {
                  value: 2,
                  message: "First name must be at least 2 characters",
                },
                pattern: {
                  value: /^[a-zA-Z\s'-]+$/,
                  message:
                    "First name can only contain letters, spaces, hyphens, and apostrophes",
                },
                onChange: () => errors.firstName && clearErrors("firstName"),
              })}
            />
            <div className="h-5">
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <FormField
              label="Last name"
              htmlFor="last-name"
              placeholder="Doe"
              asPlainInput={true}
              register={register("lastName", {
                required: "Last name is required",
                minLength: {
                  value: 2,
                  message: "Last name must be at least 2 characters",
                },
                pattern: {
                  value: /^[a-zA-Z\s'-]+$/,
                  message:
                    "Last name can only contain letters, spaces, hyphens, and apostrophes",
                },
                onChange: () => errors.lastName && clearErrors("lastName"),
              })}
            />
            <div className="h-5">
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <FormField
            label="Email"
            htmlFor="email-signup"
            icon={
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            type="email"
            placeholder="you@example.com"
            register={register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address",
              },
              validate: {
                notDisposable: (value) => {
                  // Basic disposable email check
                  const disposableDomains = [
                    "10minutemail.com",
                    "guerrillamail.com",
                    "tempmail.org",
                  ];
                  const domain = value.split("@")[1]?.toLowerCase();
                  if (disposableDomains.includes(domain)) {
                    return "Please use a permanent email address";
                  }
                  return true;
                },
              },
              onChange: () => errors.email && clearErrors("email"),
            })}
          />
          <div className="h-5">
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Password Field with Strength Indicator */}
        <div className="space-y-1">
          <FormField
            label="Password"
            htmlFor="password-signup"
            icon={
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            type="password"
            placeholder="••••••••"
            showToggle
            register={register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
              validate: {
                strength: (value) => {
                  if (!value) return true;
                  const strength = calculatePasswordStrength(value);
                  if (strength.level === "very-weak") {
                    return "Password is too weak. Please follow the requirements below.";
                  }
                  return true;
                },
                hasUppercase: (value) => {
                  if (!value) return true;
                  return (
                    /[A-Z]/.test(value) ||
                    "Password must contain at least one uppercase letter"
                  );
                },
                hasLowercase: (value) => {
                  if (!value) return true;
                  return (
                    /[a-z]/.test(value) ||
                    "Password must contain at least one lowercase letter"
                  );
                },
                hasNumber: (value) => {
                  if (!value) return true;
                  return (
                    /\d/.test(value) ||
                    "Password must contain at least one number"
                  );
                },
                hasSpecialChar: (value) => {
                  if (!value) return true;
                  return (
                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) ||
                    "Password must contain at least one special character"
                  );
                },
              },
              onChange: () => errors.password && clearErrors("password"),
            })}
          />
          <div className="min-h-5">
            {errors.password && (
              <p className="text-sm text-red-500 mb-2">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-3">
              <PasswordStrength password={password} showRequirements={true} />
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <FormField
            label="Confirm Password"
            htmlFor="confirm-password"
            icon={
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            type="password"
            placeholder="••••••••"
            showToggle
            register={register("confirmPassword", {
              required: "Please confirm your password",
              validate: {
                match: (value) => {
                  if (!value) return true;
                  return value === password || "Passwords do not match";
                },
              },
              onChange: () =>
                errors.confirmPassword && clearErrors("confirmPassword"),
            })}
          />
          <div className="h-5">
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender (Optional)</Label>
            <select
              id="gender"
              className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              {...register("gender")}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country (Optional)</Label>
            <Select
              id="country"
              options={countries}
              className="react-select"
              classNamePrefix="react-select"
              placeholder="Select country"
              isClearable
              onChange={(option) =>
                setValue(
                  "country",
                  option as { value: string; label: string } | undefined
                )
              }
            />
          </div>

          {/* Education */}
          <div className="space-y-2">
            <Label htmlFor="education">Education (Optional)</Label>
            <select
              id="education"
              className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              {...register("education")}
            >
              <option value="">Select education</option>
              <option value="bachelors">Bachelor&apos;s Degree</option>
              <option value="masters">Master&apos;s Degree</option>
              <option value="phd">PhD</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Organization */}
          <div className="space-y-1">
            <FormField
              label="Organization (Optional)"
              htmlFor="organization"
              icon={
                <Building className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              }
              placeholder="Your organization"
              register={register("organization", {
                maxLength: {
                  value: 255,
                  message: "Organization name must be less than 255 characters",
                },
              })}
            />
            <div className="h-5">
              {errors.organization && (
                <p className="text-sm text-red-500">
                  {errors.organization.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending || passwordStrength?.level === "very-weak"}
          className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isPending ? "Creating Account..." : "Create Account"}</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>

        {/* Helper Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Your username will be automatically created from your email address.
          </p>
        </div>

        <Footer />
      </CardContent>
    </form>
  );
}

export default SignUpForm;
