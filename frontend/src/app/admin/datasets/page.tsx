"use client";
import React from "react";
import { AdminLayout } from "@/app/features/admin/components/AdminLayout";
import { DatasetApproval } from "@/app/features/admin/components/DatasetApproval";

export default function AdminDatasetsPage() {
  return (
    <AdminLayout>
      <DatasetApproval />
    </AdminLayout>
  );
}
