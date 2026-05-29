// app/sitemap.ts
// Auto-generated sitemap for all public business portfolio pages.
// Google crawls this to discover and index every tradesperson's page.
// Revalidates every 24 hours so new signups appear quickly.

import type { MetadataRoute } from "next";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const revalidate = 86400; // 24 hours

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://swift-job.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all users who have a username and have gallery enabled
    const publicUsers = await db
        .select({
              username: users.username,
                    updatedAt: users.updatedAt,
                        })
                            .from(users)
                                .where(eq(users.galleryEnabled, true));

                                  // Static app routes
                                    const staticRoutes: MetadataRoute.Sitemap = [
                                        {
                                              url: BASE_URL,
                                                    lastModified: new Date(),
                                                          changeFrequency: "monthly",
                                                                priority: 0.5,
                                                                    },
                                                                        {
                                                                              url: `${BASE_URL}/login`,
                                                                                    lastModified: new Date(),
                                                                                          changeFrequency: "yearly",
                                                                                                priority: 0.3,
                                                                                                    },
                                                                                                      ];
                                                                                                      
                                                                                                        // One entry per tradesperson's public portfolio page
                                                                                                          const userRoutes: MetadataRoute.Sitemap = publicUsers
                                                                                                              .filter((u) => u.username)
                                                                                                                  .map((u) => ({
                                                                                                                        url: `${BASE_URL}/${u.username}`,
                                                                                                                              lastModified: u.updatedAt ?? new Date(),
                                                                                                                                    changeFrequency: "weekly" as const,
                                                                                                                                          priority: 0.9, // High priority — these are the money pages
                                                                                                                                              }));
                                                                                                                                              
                                                                                                                                                return [...staticRoutes, ...userRoutes];
                                                                                                                                                }
