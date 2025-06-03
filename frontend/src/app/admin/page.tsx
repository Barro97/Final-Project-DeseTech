"use client";
import React from "react";
import { AdminLayout } from "@/app/features/admin/components/AdminLayout";
import { AdminDashboard } from "@/app/features/admin/components/AdminDashboard";

export default function AdminPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
