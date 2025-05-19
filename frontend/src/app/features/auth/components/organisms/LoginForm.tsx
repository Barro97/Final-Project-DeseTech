"use client";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { SubmitHandler, useForm, FieldErrors } from "react-hook-form";
import Footer from "./Footer";
import FormField from "../molecules/FormField";
import Header from "../molecules/Header";
import { Button } from "@/app/components/atoms/button";
import { CardContent } from "@/app/components/molecules/card";
import { LoginData } from "@/app/features/auth/types/authTypes";
import { useLogin } from "../../hooks/useLogin";

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<LoginData>();
  const { mutate: login, isPending } = useLogin();

  const onSubmit: SubmitHandler<LoginData> = (data) => {
    // console.log("Form submitted with data:", data);
    login(data);
  };

  const onError = (errors: FieldErrors<LoginData>) => {
    console.log("Form validation errors:", errors);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="space-y-2"
      noValidate
    >
      <Header
        title="Login"
        description="Enter your credentials to access your account"
      ></Header>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-1">
          <FormField
            label="Email"
            htmlFor="email"
            icon={
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            type="email"
            placeholder="you@example.com"
            register={register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
              onChange: () => errors.email && clearErrors("email"),
            })}
          />
          <div className="h-5">
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <FormField
            label="Password"
            htmlFor="password"
            icon={
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            type="password"
            placeholder="••••••••"
            showToggle
            register={register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
              onChange: () => errors.password && clearErrors("password"),
            })}
          >
            <a
              href="#"
              className="text-xs text-primary transition-colors hover:text-primary/80"
            >
              Forgot password?
            </a>
          </FormField>
          <div className="h-5">
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </div>

        <Button
          disabled={isPending || isSubmitting}
          type="submit"
          className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90"
        >
          {isPending ? "Logging in..." : "Login"}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>

        <Footer />
      </CardContent>
    </form>
  );
}
export default LoginForm;
