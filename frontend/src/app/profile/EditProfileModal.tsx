"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/atoms/dialog";
import { Input } from "@/app/components/atoms/input";
import { Textarea } from "@/app/components/atoms/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/molecules/select";
import { Upload, X, Camera } from "lucide-react";
import { profileService } from "@/app/features/profile/services/profileService";
import { useAuth } from "@/app/features/auth/context/AuthContext";

export interface SkillItem {
  name: string;
  category: string;
}

export interface ProfileData {
  fullName: string;
  title: string;
  bio: string;
  aboutMe: string;
  skills: SkillItem[];
  projects: { id: number; name: string; description: string; link: string }[];
  contact: {
    email: string;
    linkedin: string;
    twitter: string;
    orcid: string;
  };
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  userId?: number;
  username?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onSave: (updatedData: ProfileData) => void;
  onProfilePictureUploaded?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profileData,
  onSave,
  onProfilePictureUploaded,
}) => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState<ProfileData>(profileData);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(profileData);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setUploadError(null);
  }, [profileData, isOpen]); // Also reset form when modal is reopened with new data

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [objectKey, fieldKey] = name.split(".") as [
        keyof ProfileData,
        string,
      ];
      setFormData((prev) => {
        const nestedObject = prev[objectKey];
        if (typeof nestedObject === "object" && nestedObject !== null) {
          return {
            ...prev,
            [objectKey]: {
              ...(nestedObject as object),
              [fieldKey]: value,
            },
          };
        }
        return prev; // Or handle error/unexpected structure
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillChange = (
    index: number,
    field: "name" | "category",
    value: string
  ) => {
    const newSkills = [...formData.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setFormData((prev) => ({ ...prev, skills: newSkills }));
  };

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: "", category: "Other" }],
    }));
  };

  const removeSkill = (index: number) => {
    const newSkills = formData.skills.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, skills: newSkills }));
  };

  const handleProjectChange = (index: number, field: string, value: string) => {
    const newProjects = [...formData.projects];
    if (!newProjects[index]) {
      newProjects[index] = {
        id: Date.now(),
        name: "",
        description: "",
        link: "",
      };
    }
    newProjects[index] = { ...newProjects[index], [field]: value };
    setFormData((prev) => ({ ...prev, projects: newProjects }));
  };

  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { id: Date.now(), name: "", description: "", link: "" },
      ],
    }));
  };

  const removeProject = (index: number) => {
    const newProjects = formData.projects.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, projects: newProjects }));
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setUploadError(null);
    setProfilePictureFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setProfilePicturePreview(previewUrl);
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePictureFile || !user?.id || !token) return;

    try {
      setIsUploadingPicture(true);
      setUploadError(null);

      const result = await profileService.uploadProfilePicture(
        user.id,
        profilePictureFile,
        token
      );

      console.log("🔍 Debug - Upload result:", result);
      console.log(
        "🔍 Debug - Profile picture URL:",
        result.profile_picture_url
      );
      console.log("🔍 Debug - URL length:", result.profile_picture_url?.length);
      console.log(
        "🔍 Debug - URL ends with ?:",
        result.profile_picture_url?.endsWith("?")
      );

      // Clean the URL on frontend as well
      let cleanUrl = result.profile_picture_url;
      if (cleanUrl && cleanUrl.endsWith("?")) {
        cleanUrl = cleanUrl.slice(0, -1);
        console.log("🔍 Debug - Cleaned URL on frontend:", cleanUrl);
      }

      // Update form data with new profile picture URL
      setFormData((prev) => ({
        ...prev,
        profilePictureUrl: cleanUrl,
      }));

      // Clear the file input and preview
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      console.log("Profile picture uploaded successfully:", result);

      // Call the callback to refresh profile data if provided
      if (onProfilePictureUploaded) {
        console.log("🔍 Debug - Calling onProfilePictureUploaded callback");
        onProfilePictureUploaded();
      } else {
        console.log("🔍 Debug - No onProfilePictureUploaded callback provided");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture"
      );
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicturePreview = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    onSave(formData);
    // console.log("Updated profile data:", formData);
    onClose();
  };

  // Helper function to get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden !bg-background !bg-opacity-100 border-gray-200 dark:border-gray-700"
        style={{
          opacity: 1,
          backgroundColor: "var(--background)",
          backdropFilter: "none",
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
          <div className="grid gap-6 py-4">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-none">
                Profile Picture
              </h3>

              <div className="flex items-center gap-4">
                {/* Current Profile Picture */}
                <div className="relative">
                  {profilePicturePreview || formData.profilePictureUrl ? (
                    <img
                      src={profilePicturePreview || formData.profilePictureUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold ring-2 ring-gray-200">
                      {getUserInitials(formData.fullName)}
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPicture}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Choose Photo
                    </Button>

                    {profilePictureFile && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUploadProfilePicture}
                          disabled={isUploadingPicture}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploadingPicture ? "Uploading..." : "Upload"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveProfilePicturePreview}
                          disabled={isUploadingPicture}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />

                  {uploadError && (
                    <p className="text-sm text-red-600">{uploadError}</p>
                  )}

                  <p className="text-xs text-gray-500">
                    JPG, PNG, GIF or WebP. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* General Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-none">General</h3>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="fullName"
                  className="text-right col-span-1 text-sm"
                >
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="title"
                  className="text-right col-span-1 text-sm"
                >
                  Title/Headline
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label
                  htmlFor="bio"
                  className="text-right col-span-1 text-sm pt-2"
                >
                  Short Bio
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label
                  htmlFor="aboutMe"
                  className="text-right col-span-1 text-sm pt-2"
                >
                  About Me
                </label>
                <Textarea
                  id="aboutMe"
                  name="aboutMe"
                  value={formData.aboutMe}
                  onChange={handleChange}
                  className="col-span-3"
                  rows={5}
                />
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium leading-none">Skills</h3>
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={skill.name}
                    onChange={(e) =>
                      handleSkillChange(index, "name", e.target.value)
                    }
                    className="flex-grow"
                    placeholder={`Skill ${index + 1}`}
                  />
                  <Select
                    value={skill.category}
                    onValueChange={(value) =>
                      handleSkillChange(index, "category", value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Core Skills">Core Skills</SelectItem>
                      <SelectItem value="Frameworks & Tools">
                        Frameworks & Tools
                      </SelectItem>
                      <SelectItem value="Specializations">
                        Specializations
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSkill(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addSkill}
                className="mt-2"
              >
                Add Skill
              </Button>
            </div>

            {/* Projects Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium leading-none">
                Projects & Publications
              </h3>
              {formData.projects.map((project, index) => (
                <div
                  key={project.id || index}
                  className="space-y-2 p-3 border rounded-md bg-gray-50/50"
                >
                  <Input
                    placeholder="Project/Publication Name"
                    value={project.name}
                    onChange={(e) =>
                      handleProjectChange(index, "name", e.target.value)
                    }
                  />
                  <Textarea
                    placeholder="Description"
                    value={project.description}
                    onChange={(e) =>
                      handleProjectChange(index, "description", e.target.value)
                    }
                    rows={2}
                  />
                  <Input
                    placeholder="Link (e.g., https://example.com)"
                    value={project.link}
                    onChange={(e) =>
                      handleProjectChange(index, "link", e.target.value)
                    }
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeProject(index)}
                    className="justify-self-start text-xs"
                  >
                    Remove Project
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addProject}
                className="mt-2"
              >
                Add Project/Publication
              </Button>
            </div>

            {/* Contact Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium leading-none">
                Contact Information
              </h3>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="contact.email"
                  className="text-right col-span-1 text-sm"
                >
                  Email
                </label>
                <Input
                  id="contact.email"
                  name="contact.email"
                  type="email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="contact.linkedin"
                  className="text-right col-span-1 text-sm"
                >
                  LinkedIn URL
                </label>
                <Input
                  id="contact.linkedin"
                  name="contact.linkedin"
                  value={formData.contact.linkedin}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="contact.twitter"
                  className="text-right col-span-1 text-sm"
                >
                  Twitter Handle
                </label>
                <Input
                  id="contact.twitter"
                  name="contact.twitter"
                  value={formData.contact.twitter}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="@yourhandle"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="contact.orcid"
                  className="text-right col-span-1 text-sm"
                >
                  ORCID
                </label>
                <Input
                  id="contact.orcid"
                  name="contact.orcid"
                  value={formData.contact.orcid}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="0000-0000-0000-0000"
                />
              </div>
            </div>

            {/* Footer buttons moved inside scrollable area */}
            <div className="flex justify-end gap-2 pt-6 mt-6 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save Changes</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
