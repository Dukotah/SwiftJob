// lib/uploadthing.ts
// Configures the Uploadthing file router.
// This defines what files are allowed to be uploaded and where they go.

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobPhotos } from "@/db/schema";

const f = createUploadthing();

export const ourFileRouter = {
  // Route for job photos (before/after shots)
  jobPhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 4 } })
    .middleware(async () => {
      // Only logged-in users can upload
      const session = await auth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Called after each photo is successfully uploaded to Uploadthing's CDN
      // The jobId is passed from the client via metadata after the job is created
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
