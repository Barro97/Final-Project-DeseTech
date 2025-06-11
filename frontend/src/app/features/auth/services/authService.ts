import { LoginData, SignUpData } from "@/app/features/auth/types/authTypes";
import axios from "axios";
import { config } from "@/app/lib/config";

export async function login(data: LoginData) {
  const response = await axios.post(`${config.BACKEND_URL}/auth/login`, data);

  return { ...response.data, accessToken: response.data.access_token };
}

export async function signup(data: SignUpData) {
  const response = await axios.post(`${config.BACKEND_URL}/users/`, {
    ...data,
    first_name: data.firstName,
    last_name: data.lastName,
    country: data.country?.label,
  });

  return response.data;
}
