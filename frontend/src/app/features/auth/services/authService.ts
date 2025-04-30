import { LoginData } from "@/app/features/auth/types/authTypes";
import axios from "axios";

export async function login(data: LoginData) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND}/users/login`,
    data
  );

  return response.data;
}
