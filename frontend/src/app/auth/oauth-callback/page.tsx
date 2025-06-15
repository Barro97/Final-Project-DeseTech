"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import axios from "axios";

export default function OAuthCallback() {
  const { data: session, status } = useSession();
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (status === "loading" || isProcessing) return;

      if (status === "unauthenticated") {
        toast({
          title: "Authentication failed",
          description: "OAuth authentication was not successful.",
          variant: "error",
        });
        router.push("/login");
        return;
      }

      if (status === "authenticated" && session?.oauth && !isProcessing) {
        setIsProcessing(true);

        try {
          // Send OAuth data to our backend
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND}/auth/oauth`,
            {
              email: session.oauth.email,
              name: session.oauth.name,
              provider: session.oauth.provider,
              provider_id: session.oauth.provider_id,
              picture: session.oauth.picture,
            }
          );

          const { access_token } = response.data;

          if (access_token) {
            // Use our existing auth system
            authLogin(access_token);

            toast({
              title: "Login successful!",
              description: "Welcome! You've been logged in with Google.",
              variant: "success",
            });

            router.push("/home");
          } else {
            throw new Error("No access token received");
          }
        } catch (error) {
          console.error("OAuth backend authentication failed:", error);

          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.detail || "Authentication failed"
            : "An unexpected error occurred";

          toast({
            title: "Authentication failed",
            description: errorMessage,
            variant: "error",
          });

          router.push("/login");
        } finally {
          setIsProcessing(false);
        }
      }
    };

    handleOAuthCallback();
  }, [session, status, authLogin, router, toast, isProcessing]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <h2 className="text-lg font-semibold">Processing your login...</h2>
        <p className="text-muted-foreground">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}
