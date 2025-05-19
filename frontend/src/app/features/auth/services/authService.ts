import { LoginData, SignUpData } from "@/app/features/auth/types/authTypes";
import axios from "axios";

export async function login(data: LoginData) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND}/auth/login`,
    data
  );

  return { ...response.data, accessToken: response.data.access_token };
}

export async function signup(data: SignUpData) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND}/users/`,
    {
      ...data,
      first_name: data.firstName,
      last_name: data.lastName,
      country: data.country?.label,
    }
  );

  return response.data;
}
