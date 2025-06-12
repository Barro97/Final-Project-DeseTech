import React from "react";

interface CoverPhotoProps {
  coverPhotoUrl?: string;
  className?: string;
  height?: "sm" | "md" | "lg";
}

export const CoverPhoto: React.FC<CoverPhotoProps> = ({
  coverPhotoUrl,
  className = "",
  height = "md",
}) => {
  const heightClasses = {
    sm: "h-32 md:h-40",
    md: "h-48 md:h-64",
    lg: "h-64 md:h-80",
  };

  return (
    <div
      className={`${heightClasses[height]} bg-cover bg-center ${className}`}
      style={{
        backgroundImage: `url(${
          coverPhotoUrl || "https://via.placeholder.com/1000x300"
        })`,
      }}
    />
  );
};

export default CoverPhoto;
