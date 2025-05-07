import { useMutation } from "@tanstack/react-query";
import { login as loginService } from "@/app/features/auth/services/authService";
import { useToast } from "../../toaster/hooks/useToast";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { LoginData, LoginResponse } from "../types/authTypes";

export function useLogin() {
  const { toast } = useToast();
  const router = useRouter();
  const { login: authLogin } = useAuth();

  return useMutation<LoginResponse, Error | AxiosError, LoginData>({
    mutationFn: loginService,
    onSuccess: (data) => {
      const token = data.accessToken;

      if (token) {
        authLogin(token);
        toast({
          title: "Login successful!",
          description: `Welcome back! Redirecting...`,
          variant: "success",
        });
        router.push("/home");
      } else {
        toast({
          title: "Login failed",
          description: "No token received from server.",
          variant: "error",
        });
      }
    },
    onError: (error: Error | AxiosError) => {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || "An error occurred during login"
          : error.message;

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "error",
      });
    },
  });
}
