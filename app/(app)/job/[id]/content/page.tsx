// /job/[id]/content — AI Caption + Post Creator
// Server wrapper: loads the job, checks auth, passes data to the client form.

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { centsToDisplay } from "@/lib/utils";
import { ContentForm } from "./content-form";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, id), eq(jobs.userId, session.user.id)),
    with: { user: true, photos: true },
  });

  if (!job) notFound();

  const photos = job.photos.map((p) => ({
    storageUrl: p.storageUrl,
    type:       p.type,
  }));

  // gbpConnected = true if the user has done the GBP OAuth flow
  // (they have a refresh token + location name stored)
  const gbpConnected = !!(
    job.user?.googleRefreshToken && job.user?.gbpLocationName
  );

  const hasPlaceId = !!job.user?.googleBusinessProfileId;

  return (
    <ContentForm
      jobId={job.id}
      description={job.description ?? undefined}
      amount={centsToDisplay(job.totalAmountCents)}
      photos={photos}
      gbpConnected={gbpConnected}
      hasPlaceId={hasPlaceId}
    />
  );
}
