import { useMutation } from "@tanstack/react-query";
import { signup } from "@/app/features/auth/services/authService";
import { useToast } from "../../toaster/hooks/useToast";
import { AxiosError } from "axios";

export function useSignup() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      toast({
        title: "Sign up successful!",
        description: "Welcome!",
        variant: "success",
      });
    },
    onError: (error: Error | AxiosError) => {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || "An error occurred during Sign up"
          : error.message;

      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "error",
      });
    },
  });
}
