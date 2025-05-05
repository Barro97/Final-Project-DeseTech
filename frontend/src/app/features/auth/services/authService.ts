import { LoginData, SignUpData } from "@/app/features/auth/types/authTypes";
import axios from "axios";

export async function login(data: LoginData) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND}/users/login`,
    data
  );

  return response.data;
}

export async function signup(data: SignUpData) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND}/users/create_new_user`,
    { ...data, first_name: data.firstName, last_name: data.lastName }
  );

  return response.data;
}
