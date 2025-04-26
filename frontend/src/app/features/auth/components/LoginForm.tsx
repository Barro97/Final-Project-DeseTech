import { useForm } from "react-hook-form";
import { CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { InputWithIcon } from "./InputWithIcon";
import { Label } from "@radix-ui/react-label";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "@radix-ui/react-separator";
import SocialLogin from "./SocialLogin";
import Header from "./Header";
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
      <Header
        title="Login"
        description="Enter your credentials to access your account"
      ></Header>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>

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
      </CardContent>
    </form>
  );
}
export default LoginForm;
