import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { logError } from "@/lib/errors";

export function useFileUploader() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const syncMetadata = useAction(api.files.syncMetadata);
  const createFile = useMutation(api.files.create);

  const uploadFile = async (dataUrl: string, canvasId: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Get file extension from mime type
      const mimeType = blob.type || "image/png";
      const extension = mimeType.split("/")[1] || "png";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Then generate upload URL and upload the file
      const { url, fileUrl, key } = await generateUploadUrl({
        canvasId,
        fileName,
      });

      // Upload directly to R2 using presigned URL
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": mimeType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      await syncMetadata({ key });

      const fileId = await createFile({ canvasId, key, url: fileUrl });

      const fileType = mimeType.startsWith("video/") ? "video" : "image";
      const typedFileId = `${fileType}-${fileId}`;

      return {
        id: typedFileId,
        url: fileUrl,
        key,
      };
    } catch (error) {
      logError(error, {
        context: "uploadFileToR2",
        canvasId,
        dataUrlSize: dataUrl.length,
      });
      throw error;
    }
  };

  return { uploadFile };
}
