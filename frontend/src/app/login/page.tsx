"use client";
import dynamic from "next/dynamic";

const AuthForms = dynamic(
  // solves a bug
  () => import("@/app/features/auth/components/auth-forms"),
  {
    ssr: false,
  }
);

export default function AuthPage() {
  return (
    <div className="theme-auth">
      <AuthForms />
    </div>
  );
}
