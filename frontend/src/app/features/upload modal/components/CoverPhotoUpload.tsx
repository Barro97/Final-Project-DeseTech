"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface CoverPhotoUploadProps {
  selectedCoverPhoto: File | null;
  onCoverPhotoChange: (file: File | null) => void;
  disabled?: boolean;
}

export function CoverPhotoUpload({
  selectedCoverPhoto,
  onCoverPhotoChange,
  disabled = false,
}: CoverPhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file for the cover photo.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Cover photo must be smaller than 5MB.");
      return;
    }

    onCoverPhotoChange(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const removeCoverPhoto = () => {
    onCoverPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Cover Photo <span className="text-gray-500">(Optional)</span>
      </label>

      {selectedCoverPhoto ? (
        // Preview selected cover photo
        <div className="relative">
          <div className="aspect-video w-full max-w-sm bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={URL.createObjectURL(selectedCoverPhoto)}
              alt="Cover photo preview"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={removeCoverPhoto}
            disabled={disabled}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            aria-label="Remove cover photo"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs text-gray-500 mt-1">
            {selectedCoverPhoto.name} (
            {Math.round(selectedCoverPhoto.size / 1024)} KB)
          </p>
        </div>
      ) : (
        // Upload area
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${
              dragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="flex flex-col items-center space-y-2">
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Click to upload
              </span>{" "}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <p className="text-xs text-gray-500">
        Cover photo will be displayed on your dataset card to help users
        identify your dataset.
      </p>
    </div>
  );
}
