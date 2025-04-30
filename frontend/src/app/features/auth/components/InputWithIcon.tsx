import { forwardRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Eye, EyeOff } from "lucide-react";
import { UseFormRegisterReturn } from "react-hook-form";

export interface InputWithIconProps {
  id: string;
  type: string;
  placeholder?: string;
  icon: React.ReactNode;
  showToggle?: boolean; // if true, adds password eye toggle
  register: UseFormRegisterReturn;
}

export const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ id, type, placeholder, icon, showToggle, register }, ref) => {
    const [visible, setVisible] = useState(false);
    const realType = showToggle ? (visible ? "text" : "password") : type;

    return (
      <div className="relative">
        {icon}
        <Input
          {...register}
          id={id}
          type={realType}
          placeholder={placeholder}
          className="pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
        />
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
            onClick={() => setVisible((v) => !v)}
            aria-label="Toggle password visibility"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        )}
      </div>
    );
  }
);
InputWithIcon.displayName = "InputWithIcon";
