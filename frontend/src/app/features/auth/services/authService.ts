import {
  LoginData,
  SignUpData,
  SignUpResponse,
} from "@/app/features/auth/types/authTypes";
import axios from "axios";
import { config } from "@/app/lib/config";

export async function login(data: LoginData) {
  const response = await axios.post(`${config.BACKEND_URL}/auth/login`, data);

  return { ...response.data, accessToken: response.data.access_token };
}

export async function signup(data: SignUpData) {
  const response = await axios.post<SignUpResponse>(
    `${config.BACKEND_URL}/users/signup`,
    {
      ...data,
      first_name: data.firstName,
      last_name: data.lastName,
      country: data.country?.label,
    }
  );

  // Return in the same format as login for consistency
  return {
    ...response.data,
    accessToken: response.data.access_token,
    user: response.data.user,
  };
}
