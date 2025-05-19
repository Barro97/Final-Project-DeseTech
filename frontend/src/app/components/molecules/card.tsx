import * as React from "react";
import { cn } from "@/app/lib/utils";

type CardVariant = "default" | "auth";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "border bg-card text-card-foreground",
        variant === "default" && "rounded-lg shadow-sm",
        variant === "auth" && "rounded-xl shadow",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

type CardTitleElement = "h3" | "div";
interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement | HTMLDivElement> {
  as?: CardTitleElement;
}

const CardTitle = React.forwardRef<
  HTMLHeadingElement | HTMLDivElement,
  CardTitleProps
>(({ className, as: Component = "h3", ...props }, ref) => {
  return (
    <Component
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight",
        Component === "h3" && "text-2xl",
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

type CardDescriptionElement = "p" | "div";
interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement | HTMLDivElement> {
  as?: CardDescriptionElement;
}

const CardDescription = React.forwardRef<
  HTMLParagraphElement | HTMLDivElement,
  CardDescriptionProps
>(({ className, as: Component = "p", ...props }, ref) => {
  return (
    <Component
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
