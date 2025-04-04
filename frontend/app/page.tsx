"use client";

import { FileUpload } from "./components/file-upload";

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">File Upload Example</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-3">Basic File Upload</h2>
          <FileUpload
            onUpload={async (files) => {
              // In a real application, you would upload the files to your server or a storage service
              console.log("Files to upload:", files);

              // Simulate network delay
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // Return success
              return Promise.resolve();
            }}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Image Upload Only</h2>
          <FileUpload
            accept="image/*"
            maxSize={2 * 1024 * 1024} // 2MB
            onUpload={async (files) => {
              console.log("Images to upload:", files);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              return Promise.resolve();
            }}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">PDF Upload</h2>
          <FileUpload
            accept=".pdf,application/pdf"
            maxFiles={1}
            onUpload={async (files) => {
              console.log("PDF to upload:", files);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              return Promise.resolve();
            }}
          />
        </div>
      </div>
    </main>
  );
}
