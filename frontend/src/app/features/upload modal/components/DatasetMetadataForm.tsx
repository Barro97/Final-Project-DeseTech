"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";

// Define a more specific type for the form values this component handles
interface DatasetMetadataFormValues {
  name: string;
  description: string;
  geographic_location?: string;
  data_time_period?: string;
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

      <div className="space-y-2">
        <label htmlFor="geographic_location" className="text-sm font-medium">
          Geographic Location <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          id="geographic_location"
          className="w-full p-2 border rounded-md"
          placeholder="e.g., Kenya, Nairobi County; Farm coordinates: 1.2921, 36.8219"
          disabled={isSubmitting}
          {...register("geographic_location", {
            maxLength: {
              value: 500,
              message: "Geographic location cannot exceed 500 characters",
            },
          })}
        />
        {errors.geographic_location && (
          <p className="text-destructive text-sm">
            {errors.geographic_location.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Specify where the data was collected (country, region, farm,
          coordinates, etc.)
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="data_time_period" className="text-sm font-medium">
          Data Time Period <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          id="data_time_period"
          className="w-full p-2 border rounded-md"
          placeholder="e.g., 2020-2023, Growing season 2022, January-March 2024"
          disabled={isSubmitting}
          {...register("data_time_period", {
            maxLength: {
              value: 100,
              message: "Data time period cannot exceed 100 characters",
            },
          })}
        />
        {errors.data_time_period && (
          <p className="text-destructive text-sm">
            {errors.data_time_period.message}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Specify when the data was collected (different from upload date)
        </p>
      </div>
    </>
  );
}
