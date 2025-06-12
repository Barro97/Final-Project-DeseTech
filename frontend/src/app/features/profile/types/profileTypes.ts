/**
 * Profile Types - TypeScript definitions for Profile system
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the profile feature, ensuring type safety and consistency.
 */

export interface SkillItem {
  name: string;
  category: string;
}

export interface ProfileData {
  fullName: string;
  title: string;
  organization?: string;
  bio: string;
  aboutMe: string;
  skills: SkillItem[];
  projects: ProjectItem[];
  contact: ContactInfo;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  // Additional metadata
  userId?: number;
  username?: string;
  privacyLevel?: string;
  profileCompletionPercentage?: number;
  isOwnProfile?: boolean;
}

export interface ProjectItem {
  id: number;
  name: string;
  description: string;
  link: string;
}

export interface ContactInfo {
  email: string;
  linkedin: string;
  twitter: string;
  orcid: string;
}

export interface ProfileResponse {
  user_id: number;
  username: string;
  fullName: string;
  title: string;
  organization?: string;
  bio: string;
  aboutMe: string;
  skills: SkillItem[];
  projects: ProjectItem[];
  contact: ContactInfo;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  privacy_level: string;
  profile_completion_percentage: number;
  is_own_profile: boolean;
}

export interface ProfileUpdateRequest {
  title?: string;
  organization?: string;
  bio?: string;
  aboutMe?: string;
  coverPhotoUrl?: string;
  skills?: SkillItem[];
  projects?: ProjectItem[];
  contact?: ContactInfo;
  privacy_level?: string;
}
