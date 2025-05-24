"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";

const AuthForms = dynamic(
  // solves a bug
  () => import("@/app/features/auth/components/templates/AuthForms"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    ),
  }
);

export default function AuthPage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure the sidebar-visible class is removed immediately on the login page
    document.body.classList.remove("sidebar-visible");
    // Mark the component as ready to render after sidebar is hidden
    setIsReady(true);

    return () => {
      // This cleanup ensures the class stays removed when navigating away
      document.body.classList.remove("sidebar-visible");
    };
  }, []);

  if (!isReady)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="theme-auth w-full h-full">
      <AuthForms />
    </div>
  );
}
