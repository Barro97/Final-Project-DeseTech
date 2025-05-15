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
  accept?: string
): { valid: boolean; error?: string } => {
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds the limit of ${formatBytes(maxSize)}`,
    };
  }

  // If accept is undefined, null, empty string, or "*", accept all file types
  if (!accept || accept === "*" || accept.trim() === "") {
    return { valid: true };
  }

  const acceptedTypes = accept.split(",").map((type) => type.trim());
  // Handle case where file might not have a type
  const fileExtension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : "";
  const fileType =
    file.type || (fileExtension ? `application/${fileExtension}` : "");

  if (!fileType) {
    return {
      valid: false,
      error: "Unable to determine file type",
    };
  }

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

  return { valid: true };
};
