import { FileItem } from "@/app/types/file";
export async function uploadFile(dataset_id: number, file: FileItem) {
  const formData = new FormData();
  formData.append("dataset_id", String(dataset_id));
  formData.append("file", file.file);

  try {
    const res = await fetch(`${process.env.BACKEND}/upload-file/`, {
      method: "POST",
      body: formData,
    });

    return res.json();
  } catch (e) {
    console.error("An error occurred while uploading file: ", e);
  }
}
