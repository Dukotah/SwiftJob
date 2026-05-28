// app/api/uploadthing/route.ts
// Handles all Uploadthing file upload requests.
// Uploadthing calls this endpoint when a file is being uploaded.

import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
