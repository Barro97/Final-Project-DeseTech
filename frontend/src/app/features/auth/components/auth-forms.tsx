"use client";
import { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  User,
  Github,
} from "lucide-react";
import { Button } from "@/app/features/auth/components/ui/button";
import { Input } from "@/app/features/auth/components/ui/input";
import { Label } from "@/app/features/auth/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/features/auth/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/features/auth/components/ui/tabs";
import { Separator } from "@/app/features/auth/components/ui/separator";
import { cn } from "@/app/lib/utils";

export default function AuthForms() {
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const loginRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);

    // Set initial height
    if (activeTab === "login" && loginRef.current) {
      setContentHeight(loginRef.current.scrollHeight);
    } else if (activeTab === "signup" && signupRef.current) {
      setContentHeight(signupRef.current.scrollHeight);
    }
  }, []);

  // Update height when tab changes
  useEffect(() => {
    if (!mounted) return;

    const timer = setTimeout(() => {
      if (activeTab === "login" && loginRef.current) {
        setContentHeight(loginRef.current.scrollHeight);
      } else if (activeTab === "signup" && signupRef.current) {
        setContentHeight(signupRef.current.scrollHeight);
      }
    }, 10); // Small delay to ensure DOM is updated

    return () => clearTimeout(timer);
  }, [activeTab, mounted]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Please sign in to your account or create a new one
          </p>
        </div>

        <div className="relative">
          <div
            className={cn(
              "absolute inset-0 rounded-[var(--radius)] bg-primary/5 blur-xl transition-all duration-500",
              activeTab === "login" ? "opacity-50" : "opacity-30"
            )}
          />

          <Card className="relative overflow-hidden border-border bg-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
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

              <div
                className="relative overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  height: contentHeight ? `${contentHeight}px` : "auto",
                }}
              >
                <TabsContent
                  value="login"
                  className="absolute w-full animate-in fade-in data-[state=inactive]:animate-out data-[state=inactive]:fade-out data-[state=active]:duration-300"
                  ref={loginRef}
                >
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-2xl font-bold">Login</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email-login"
                        className="text-sm font-medium"
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email-login"
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="password-login"
                          className="text-sm font-medium"
                        >
                          Password
                        </Label>
                        <a
                          href="#"
                          className="text-xs text-primary transition-colors hover:text-primary/80"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password-login"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90">
                      <span>Login</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 transition-all hover:bg-muted"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          width="16"
                          height="16"
                        >
                          <path
                            fill="#FFC107"
                            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                          />
                          <path
                            fill="#FF3D00"
                            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                          />
                          <path
                            fill="#4CAF50"
                            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                          />
                          <path
                            fill="#1976D2"
                            d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                          />
                        </svg>
                        <span>Google</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 transition-all hover:bg-muted"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </Button>
                    </div>
                  </CardContent>
                </TabsContent>

                <TabsContent
                  value="signup"
                  className="absolute w-full animate-in fade-in data-[state=inactive]:animate-out data-[state=inactive]:fade-out data-[state=active]:duration-300"
                  ref={signupRef}
                >
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-2xl font-bold">
                      Create an account
                    </CardTitle>
                    <CardDescription>
                      Enter your information to create an account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="first-name"
                          className="text-sm font-medium"
                        >
                          First name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="first-name"
                            placeholder="John"
                            className="pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="last-name"
                          className="text-sm font-medium"
                        >
                          Last name
                        </Label>
                        <Input
                          id="last-name"
                          placeholder="Doe"
                          className="transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email-signup"
                        className="text-sm font-medium"
                      >
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email-signup"
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="password-signup"
                        className="text-sm font-medium"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password-signup"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirm-password"
                        className="text-sm font-medium"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="terms"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        required
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground"
                      >
                        I agree to the{" "}
                        <a
                          href="#"
                          className="text-primary hover:text-primary/80"
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="#"
                          className="text-primary hover:text-primary/80"
                        >
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90">
                      <span>Create Account</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 transition-all hover:bg-muted"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          width="16"
                          height="16"
                        >
                          <path
                            fill="#FFC107"
                            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                          />
                          <path
                            fill="#FF3D00"
                            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                          />
                          <path
                            fill="#4CAF50"
                            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                          />
                          <path
                            fill="#1976D2"
                            d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                          />
                        </svg>
                        <span>Google</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 transition-all hover:bg-muted"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </Button>
                    </div>
                  </CardContent>
                </TabsContent>
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
