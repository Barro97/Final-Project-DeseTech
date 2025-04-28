import { Label } from "@radix-ui/react-label";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import Footer from "./Footer";
import Header from "./Header";
import { InputWithIcon } from "./InputWithIcon";
import { Button } from "./ui/button";
import { CardContent } from "./ui/card";
import FormField from "./FormField";
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
        <FormField
          label="Email"
          htmlFor="email"
          icon={
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          }
          type="email"
          placeholder="you@example.com"
          register={register("email", { required: true })}
        />
        <FormField
          label="Password"
          htmlFor="password"
          icon={
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          }
          type="password"
          placeholder="••••••••"
          showToggle
          register={register("password", { required: true })}
        >
          <a
            href="#"
            className="text-xs text-primary transition-colors hover:text-primary/80"
          >
            Forgot password?
          </a>
        </FormField>

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90"
        >
          <span>Login</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>

        <Footer />
      </CardContent>
    </form>
  );
}
export default LoginForm;
