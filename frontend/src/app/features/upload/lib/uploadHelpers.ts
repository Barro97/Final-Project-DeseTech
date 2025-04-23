export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  );
};

export const validateFile = (
  file: File,
  maxSize: number,
  accept: string
): { valid: boolean; error?: string } => {
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds the limit of ${formatBytes(maxSize)}`,
    };
  }

  if (accept !== "*") {
    const acceptedTypes = accept.split(",").map((type) => type.trim());
    const fileType = file.type || `application/${file.name.split(".").pop()}`;

    const isAccepted = acceptedTypes.some((type) => {
      if (type.includes("*")) {
        return fileType.startsWith(type.replace("*", ""));
      }
      return type === fileType;
    });

    if (!isAccepted) {
      return {
        valid: false,
        error: "File type not accepted",
      };
    }
  }

  return { valid: true };
};
