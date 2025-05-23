"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/app/components/atoms/dialog";
import { Input } from "@/app/components/atoms/input";
import { Textarea } from "@/app/components/atoms/textarea";

export interface ProfileData {
  fullName: string;
  title: string;
  bio: string;
  aboutMe: string;
  skills: string[];
  projects: { id: number; name: string; description: string; link: string }[];
  contact: {
    email: string;
    linkedin: string;
    twitter: string;
    orcid: string;
  };
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onSave: (updatedData: ProfileData) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profileData,
  onSave,
}) => {
  const [formData, setFormData] = useState<ProfileData>(profileData);

  useEffect(() => {
    setFormData(profileData);
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

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    setFormData((prev) => ({ ...prev, skills: newSkills }));
  };

  const addSkill = () => {
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, ""] }));
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

  const handleSubmit = () => {
    onSave(formData);
    console.log("Updated profile data:", formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
              <label htmlFor="title" className="text-right col-span-1 text-sm">
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
                  value={skill}
                  onChange={(e) => handleSkillChange(index, e.target.value)}
                  className="flex-grow"
                  placeholder={`Skill ${index + 1}`}
                />
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
        </div>
        <DialogFooter className="mt-6 sticky bottom-0 bg-background py-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
