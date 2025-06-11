"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/molecules/card";
import {
  Edit3,
  Mail,
  Linkedin,
  Twitter,
  ExternalLink,
  Code,
  Brain,
  Zap,
} from "lucide-react";
import { EditProfileModal } from "../EditProfileModal";
import { ProfileData } from "@/app/features/profile/types/profileTypes";
import { profileService } from "@/app/features/profile/services/profileService";

const UserProfilePage = () => {
  const { user, isLoading: authLoading, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile data
        const profile = await profileService.getProfile(
          userId,
          token || undefined
        );
        setProfileData(profile);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [userId, user, token, authLoading]);

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveProfile = async (updatedData: ProfileData) => {
    try {
      if (!token) {
        throw new Error("Authentication required");
      }

      const updated = await profileService.updateProfile(
        userId,
        updatedData,
        token
      );
      setProfileData(updated);
      console.log("Profile updated successfully:", updated);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const refreshProfile = async () => {
    try {
      setError(null);
      const profile = await profileService.getProfile(
        userId,
        token || undefined
      );
      setProfileData(profile);
    } catch (err) {
      console.error("Error refreshing profile:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh profile"
      );
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No profile data
  if (!profileData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            The requested profile could not be found.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = profileData.isOwnProfile;

  // Helper function to get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Categorize skills - categories are now stored with each skill
  const categorizeSkills = () => {
    const categorized: { [key: string]: string[] } = {};

    profileData.skills.forEach((skill) => {
      const category = skill.category || "Other";
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(skill.name);
    });

    return categorized;
  };

  const categorizedSkills = categorizeSkills();

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Core Skills":
        return <Brain className="h-4 w-4" />;
      case "Frameworks & Tools":
        return <Code className="h-4 w-4" />;
      case "Specializations":
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div
        className="h-48 md:h-64 bg-cover bg-center"
        style={{
          backgroundImage: `url(${profileData.coverPhotoUrl || "https://via.placeholder.com/1000x300"})`,
        }}
      ></div>

      <div className="container mx-auto px-4 -mt-16 sm:-mt-24 pb-12">
        {/* Enhanced Profile Header with Gradient Background */}
        <Card className="mb-8 overflow-hidden shadow-lg rounded-2xl border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-indigo-100 to-sky-100 px-6 pt-6 pb-2">
            <CardContent className="pt-0">
              <div className="flex flex-col items-center sm:flex-row sm:items-end">
                {/* Enhanced Avatar with Ring and Fallback */}
                <div className="relative sm:mr-6">
                  {profileData.profilePictureUrl ? (
                    <img
                      src={profileData.profilePictureUrl}
                      alt={profileData.fullName}
                      className="w-32 h-32 rounded-full ring-4 ring-white shadow-lg object-cover transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {getUserInitials(profileData.fullName)}
                    </div>
                  )}
                </div>

                {/* Enhanced Typography */}
                <div className="mt-4 sm:mt-0 text-center sm:text-left flex-grow">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    {profileData.fullName}
                  </h1>
                  <p className="text-lg text-gray-600 mb-3">
                    {profileData.title}
                  </p>
                  <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                    {profileData.bio}
                  </p>
                </div>

                {/* Enhanced Edit Button */}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 sm:mt-0 sm:ml-auto flex-shrink-0 transition-all hover:shadow-md hover:-translate-y-0.5 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
                    onClick={handleOpenEditModal}
                  >
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column (About Me, Skills) */}
          <div className="md:col-span-2 space-y-8">
            {/* Enhanced About Me Section */}
            <Card className="shadow-md rounded-2xl transition-shadow hover:shadow-lg border-gray-200 dark:border-gray-700">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl">About Me</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <p className="text-gray-700 leading-relaxed max-w-prose">
                  {profileData.aboutMe || "No additional information provided."}
                </p>
              </CardContent>
            </Card>

            {/* Enhanced Skills Section with Categories */}
            <Card className="shadow-md rounded-2xl transition-shadow hover:shadow-lg border-gray-200 dark:border-gray-700">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl">Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-6">
                  {Object.entries(categorizedSkills).map(
                    ([category, skills]) => (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          {getCategoryIcon(category)}
                          <h3 className="font-semibold text-gray-800">
                            {category}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span
                              key={skill}
                              className="bg-muted text-sm rounded-full px-3 py-1 font-medium hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-default"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Projects/Publications, Contact) */}
          <div className="space-y-8">
            {/* Enhanced Projects Section with Individual Cards */}
            <Card className="shadow-md rounded-2xl transition-shadow hover:shadow-lg border-gray-200 dark:border-gray-700">
              <CardHeader className="p-6">
                <CardTitle className="text-xl">
                  Projects & Publications
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {profileData.projects.length > 0 ? (
                  <div className="space-y-4">
                    {profileData.projects.map((project) => (
                      <Card
                        key={project.id || project.name}
                        className="shadow-sm rounded-xl p-4 hover:shadow-lg transition-shadow border-gray-200 dark:border-gray-700"
                      >
                        <div>
                          <a
                            href={project.link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:underline hover:text-blue-800 transition-colors flex items-center gap-1"
                          >
                            {project.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {project.description}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No projects or publications listed yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Contact Section with Icons */}
            <Card className="shadow-md rounded-2xl transition-shadow hover:shadow-lg lg:sticky lg:top-24 border-gray-200 dark:border-gray-700">
              <CardHeader className="p-6">
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      <a
                        href={`mailto:${profileData.contact.email}`}
                        className="text-blue-600 hover:underline transition-colors"
                      >
                        {profileData.contact.email}
                      </a>
                    </div>
                  </div>

                  {profileData.contact.linkedin && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">LinkedIn:</span>{" "}
                        <a
                          href={
                            profileData.contact.linkedin.startsWith("http")
                              ? profileData.contact.linkedin
                              : `https://${profileData.contact.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline transition-colors"
                        >
                          {profileData.contact.linkedin}
                        </a>
                      </div>
                    </div>
                  )}

                  {profileData.contact.twitter && (
                    <div className="flex items-center gap-3">
                      <Twitter className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">Twitter:</span>{" "}
                        <a
                          href={`https://twitter.com/${profileData.contact.twitter.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline transition-colors"
                        >
                          {profileData.contact.twitter}
                        </a>
                      </div>
                    </div>
                  )}

                  {profileData.contact.orcid && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">ORCID:</span>{" "}
                        <a
                          href={`https://orcid.org/${profileData.contact.orcid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline transition-colors"
                        >
                          {profileData.contact.orcid}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          profileData={profileData}
          onSave={handleSaveProfile}
          onProfilePictureUploaded={refreshProfile}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
