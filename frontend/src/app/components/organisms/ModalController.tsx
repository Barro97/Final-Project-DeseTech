"use client";
import { useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { UploadModal } from "@/app/features/upload modal/modal";
import { createPortal } from "react-dom";

export function ModalController() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <AppSidebar onOpenModal={() => setOpenModal(true)} />
      {/* Render the modal outside of any parent container that might affect its styling */}
      {typeof window !== "undefined" &&
        createPortal(
          <UploadModal open={openModal} setOpen={setOpenModal} />,
          document.body
        )}
    </>
  );
}
