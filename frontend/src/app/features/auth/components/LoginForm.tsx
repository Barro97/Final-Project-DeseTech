import { useForm } from "react-hook-form";
import { CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { InputWithIcon } from "./InputWithIcon";
import { Label } from "@radix-ui/react-label";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "@radix-ui/react-separator";
import SocialLogin from "./SocialLogin";
interface LoginData {
  email: string;
  password: string;
}

function LoginForm() {
  const { register, handleSubmit, formState } = useForm<LoginData>();

  function onSubmit(data: LoginData) {
    //Implement submit logic
    console.log("Form is submitting");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          {/* <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              id="email-login"
              type="email"
              placeholder="name@example.com"
              className="pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div> */}
          <InputWithIcon
            id="email"
            type="email"
            placeholder="you@example.com"
            icon={
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            {...register("email", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <a
              href="#"
              className="text-xs text-primary transition-colors hover:text-primary/80"
            >
              Forgot password?
            </a>
          </div>
          {/* <div className="relative">
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
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div> */}
          <InputWithIcon
            id="password"
            type="password"
            placeholder="••••••••"
            icon={
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            showToggle
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90"
        >
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
        <SocialLogin />

        {/* <div className="grid grid-cols-2 gap-3">
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
        </div> */}
      </CardContent>
    </form>
  );
}
export default LoginForm;
