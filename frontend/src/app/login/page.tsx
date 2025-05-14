"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const AuthForms = dynamic(
  // solves a bug
  () => import("@/app/features/auth/components/auth-forms"),
  {
    ssr: false,
  }
);

export default function AuthPage() {
  useEffect(() => {
    // Ensure the sidebar-visible class is removed on the login page
    document.body.classList.remove("sidebar-visible");
  }, []);

  return (
    <div className="theme-auth">
      <AuthForms />
    </div>
  );
}
