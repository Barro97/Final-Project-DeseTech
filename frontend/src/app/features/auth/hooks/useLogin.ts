import { useMutation } from "@tanstack/react-query";
import { login } from "@/app/features/auth/services/authService";
import { useToast } from "../../toaster/hooks/useToast";
import { AxiosError } from "axios";

export function useLogin() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      toast({
        title: "Login successful!",
        description: "Welcome back!",
        variant: "success",
      });
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
