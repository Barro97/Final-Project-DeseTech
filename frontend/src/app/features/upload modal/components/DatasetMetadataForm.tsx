"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";

// Define a more specific type for the form values this component handles
interface DatasetMetadataFormValues {
  name: string;
  description: string;
}

interface DatasetMetadataFormProps {
  register: UseFormRegister<DatasetMetadataFormValues>;
  errors: FieldErrors<DatasetMetadataFormValues>;
  isSubmitting: boolean;
}

export function DatasetMetadataForm({
  register,
  errors,
  isSubmitting,
}: DatasetMetadataFormProps) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Dataset Name
        </label>
        <input
          id="name"
          className="w-full p-2 border rounded-md"
          placeholder="Enter dataset name"
          disabled={isSubmitting}
          {...register("name", { required: "Dataset name is required" })}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          className="w-full p-2 border rounded-md min-h-[80px]"
          placeholder="Provide a short description of the dataset"
          disabled={isSubmitting}
          {...register("description", {
            required: "Description is required",
          })}
        />
        {errors.description && (
          <p className="text-destructive text-sm">
            {errors.description.message}
          </p>
        )}
      </div>
    </>
  );
}
