"use client";

import { AdminLayout } from "@/app/features/admin/components/AdminLayout";
import { AdminTagManagement } from "@/app/features/tag/components/AdminTagManagement";

export default function AdminTagsPage() {
  return (
    <AdminLayout>
      <AdminTagManagement />
    </AdminLayout>
  );
}
