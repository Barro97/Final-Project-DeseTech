import React from "react";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[100px]">
      <div
        className={`${sizeClasses[size]} rounded-full border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin`}
      ></div>
    </div>
  );
}
