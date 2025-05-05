export interface LoginData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  country?: { value: string; label: string };
  education?: "bachelors" | "masters" | "phd" | "other";
  organization?: string;
}
