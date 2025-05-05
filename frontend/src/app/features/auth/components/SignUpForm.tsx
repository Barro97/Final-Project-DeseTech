import { ArrowRight, Lock, Mail, User, Building } from "lucide-react";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
import Select from "react-select";
import countryList from "react-select-country-list";
import { useMemo } from "react";
import Footer from "./Footer";
import FormField from "./FormField";
import Header from "./Header";
import { Button } from "./ui/button";
import { CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { SignUpData } from "@/app/features/auth/types/authTypes";
import { useSignup } from "@/app/features/auth/hooks/useSignup";

function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    watch,
    setValue,
  } = useForm<SignUpData>();

  const { mutate: signup, isPending } = useSignup();

  const countries = useMemo(() => countryList().getData(), []);
  const password = watch("password");

  const onSubmit: SubmitHandler<SignUpData> = (data) => {
    signup(data);
  };

  const onError = (errors: FieldErrors<SignUpData>) => {
    console.log("Form validation errors:", errors);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="space-y-2"
      noValidate
    >
      <Header
        title="Create an account"
        description="Enter your information to create an account"
      />
      <CardContent className="space-y-4 pt-0">
        {/* Username Field */}
        <div className="space-y-1">
          <FormField
            label="Username"
            htmlFor="username"
            icon={
              <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            placeholder="johndoe123"
            register={register("username", {
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
              onChange: () => errors.username && clearErrors("username"),
            })}
          />
          <div className="h-5">
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <FormField
              label="First name"
              htmlFor="first-name"
              icon={
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              }
              placeholder="John"
              register={register("firstName", {
                required: "First name is required",
                onChange: () => errors.firstName && clearErrors("firstName"),
              })}
            />
            <div className="h-5">
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <FormField
              label="Last name"
              htmlFor="last-name"
              placeholder="Doe"
              asPlainInput={true}
              register={register("lastName", {
                required: "Last name is required",
                onChange: () => errors.lastName && clearErrors("lastName"),
              })}
            />
            <div className="h-5">
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <FormField
            label="Email"
            htmlFor="email-signup"
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

        {/* Password Fields */}
        <div className="space-y-1">
          <FormField
            label="Password"
            htmlFor="password-signup"
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
          />
          <div className="h-5">
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <FormField
            label="Confirm Password"
            htmlFor="confirm-password"
            icon={
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            }
            type="password"
            placeholder="••••••••"
            showToggle
            register={register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
              onChange: () =>
                errors.confirmPassword && clearErrors("confirmPassword"),
            })}
          />
          <div className="h-5">
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender (Optional)</Label>
            <select
              id="gender"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              {...register("gender")}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country (Optional)</Label>
            <Select
              id="country"
              options={countries}
              className="react-select"
              classNamePrefix="react-select"
              placeholder="Select country"
              isClearable
              onChange={(option) => setValue("country", option)}
            />
          </div>

          {/* Education */}
          <div className="space-y-2">
            <Label htmlFor="education">Education (Optional)</Label>
            <select
              id="education"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              {...register("education")}
            >
              <option value="">Select education</option>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
              <option value="phd">PhD</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Organization */}
          <div className="space-y-1">
            <FormField
              label="Organization (Optional)"
              htmlFor="organization"
              icon={
                <Building className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              }
              placeholder="Your organization"
              register={register("organization")}
            />
          </div>
        </div>

        {/* Terms Checkbox */}
        {/* <div className="flex items-center space-x-2">
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
        </div> */}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90"
        >
          <span>Create Account</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>

        <Footer />
      </CardContent>
    </form>
  );
}

export default SignUpForm;
