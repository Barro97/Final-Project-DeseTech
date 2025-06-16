"use client";
import { Card } from "@/app/components/molecules/card";
import { Tabs, TabsList, TabsTrigger } from "../atoms/Tabs";
import { useRef, useState } from "react";
import LoginForm from "../organisms/LoginForm";
import SignUpForm from "../organisms/SignUpForm";

export default function AuthForms() {
  const [activeTab, setActiveTab] = useState("login");

  const loginRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Please sign in to your account or create a new one
          </p>
        </div>

        <div className="relative">
          <div
            className={`absolute inset-0 rounded-[var(--radius)] bg-primary/5 blur-xl transition-all duration-500 ${
              activeTab === "login" ? "opacity-50" : "opacity-30"
            }`}
          />

          <Card
            className="relative overflow-hidden border-border bg-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
            variant="auth"
          >
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-b-none bg-muted p-1">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <div className="relative overflow-hidden">
                {/* Always render both forms to prevent hooks order issues */}
                <div
                  ref={loginRef}
                  style={{ display: activeTab === "login" ? "block" : "none" }}
                >
                  <LoginForm />
                </div>

                <div
                  ref={signupRef}
                  style={{ display: activeTab === "signup" ? "block" : "none" }}
                >
                  <SignUpForm />
                </div>
              </div>
            </Tabs>
          </Card>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Protected by industry standard encryption</p>
        </div>
      </div>
    </div>
  );
}
