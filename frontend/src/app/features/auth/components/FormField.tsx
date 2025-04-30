import { ReactNode } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { Label } from "./ui/label";
import { InputWithIcon } from "./InputWithIcon";
import { Input } from "./ui/input";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  icon?: ReactNode;
  type?: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  showToggle?: boolean;
  asPlainInput?: boolean;
  children?: ReactNode;
}

function FormField({
  label,
  htmlFor,
  icon,
  type = "text",
  placeholder,
  register,
  showToggle = false,
  asPlainInput = false,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {children}
      </div>
      {asPlainInput ? (
        <Input
          id={htmlFor}
          placeholder={placeholder}
          type={type}
          {...register}
        />
      ) : (
        <InputWithIcon
          id={htmlFor}
          type={type}
          placeholder={placeholder}
          icon={icon}
          showToggle={showToggle}
          register={register}
        />
      )}
    </div>
  );
}
export default FormField;
