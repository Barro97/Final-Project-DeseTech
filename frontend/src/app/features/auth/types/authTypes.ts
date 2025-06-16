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

export interface SignUpResponse {
  user: {
    user_id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  access_token: string;
  token_type: string;
  message: string;
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
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  country?: { value: string; label: string };
  education?: "bachelors" | "masters" | "phd" | "other";
  organization?: string;
}
