// import AuthForms from "@/app/features/auth/components/auth-forms";
"use client";
import dynamic from "next/dynamic";

const AuthForms = dynamic(
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
