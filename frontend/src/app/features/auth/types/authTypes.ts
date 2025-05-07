export interface LoginData {
  email: string;
  password?: string; // Optional for social logins, for example
  isSocialLogin?: boolean;
  provider?: string; // e.g., 'google', 'facebook'
}

export interface RegisterData extends LoginData {
  username: string;
}

export interface LoginResponse {
  accessToken: string;
  email: string; // Or other user details you expect from the login response
  // Add any other fields your backend returns on successful login
}

// You can also define a more generic User type if needed elsewhere
export interface User {
  email: string;
  role: string;
  username?: string;
  // other user properties
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
