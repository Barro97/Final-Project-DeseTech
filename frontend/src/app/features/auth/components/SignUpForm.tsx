import { useForm } from "react-hook-form";
import Header from "./Header";
import { CardContent } from "./ui/card";
import { InputWithIcon } from "./InputWithIcon";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Footer from "./Footer";

interface SignUpData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

function SignUpForm() {
  const { register, handleSubmit, formState } = useForm<SignUpData>();

  function onSubmit(data: SignUpData) {
    //Implement submit logic
    console.log("Form is submitting");
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <Header
        title="Create an account"
        description="Enter your information to create an account"
      />
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name" className="text-sm font-medium">
              First name
            </Label>
            <InputWithIcon
              id="first-name"
              type="text"
              placeholder="John"
              icon={
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              }
              {...register("firstName", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name" className="text-sm font-medium">
              Last name
            </Label>
            <Input
              id="last-name"
              placeholder="Doe"
              className="transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
              {...register("lastName", { required: true })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-signup" className="text-sm font-medium">
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
          <Label htmlFor="password-signup" className="text-sm font-medium">
            Password
          </Label>
          <InputWithIcon
            id="password"
            type="password"
            placeholder="••••••••"
            icon={
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            showToggle
            {...register("password", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium">
            Confirm Password
          </Label>
          <InputWithIcon
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            icon={
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            showToggle
            {...register("confirmPassword", { required: true })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="terms"
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            required
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="#" className="text-primary hover:text-primary/80">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:text-primary/80">
              Privacy Policy
            </a>
          </label>
        </div>
        <Button className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90">
          <span>Create Account</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>

        <Footer />
      </CardContent>
    </form>
  );
}
export default SignUpForm;
