"use client";
import React from "react";
import { AdminLayout } from "@/app/features/admin/components/AdminLayout";
import { UserManagement } from "@/app/features/admin/components/UserManagement";

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
}
