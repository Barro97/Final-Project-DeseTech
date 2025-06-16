import { useMutation } from "@tanstack/react-query";
import { signup } from "@/app/features/auth/services/authService";
import { useToast } from "../../toaster/hooks/useToast";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

export function useSignup() {
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      // Automatically log in the user with the received token
      if (data.accessToken) {
        authLogin(data.accessToken);

        toast({
          title: "Welcome to the platform!",
          description: `Account created successfully. Welcome, ${data.user?.first_name || "User"}!`,
          variant: "success",
        });

        // Use setTimeout to ensure state updates have completed before navigation
        setTimeout(() => {
          router.push("/home");
        }, 100);
      } else {
        toast({
          title: "Account created!",
          description: "Please log in with your credentials.",
          variant: "success",
        });

        // Fallback: redirect to login if no token received
        setTimeout(() => {
          router.push("/login");
        }, 100);
      }
    },
    onError: (error: Error | AxiosError) => {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.detail ||
            error.response?.data?.message ||
            "An error occurred during sign up"
          : error.message;

      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "error",
      });
    },
  });
}
