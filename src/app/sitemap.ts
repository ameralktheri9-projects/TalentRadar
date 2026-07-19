import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXTAUTH_URL ?? "https://talent-radar-gamma.vercel.app";

  let agencies: Array<{ publicSlug: string | null; created_at: Date }> = [];
  try {
    agencies = await prisma.agency.findMany({
      where: { status: "ACTIVE", publicSlug: { not: null } },
      select: { publicSlug: true, created_at: true },
    });
  } catch {
    // DB may not be available at build time
  }

  return [
    { url: BASE,                            lastModified: new Date(), changeFrequency: "daily",   priority: 1 },
    { url: `${BASE}/login`,                 lastModified: new Date(), changeFrequency: "monthly",  priority: 0.5 },
    { url: `${BASE}/register/company`,      lastModified: new Date(), changeFrequency: "monthly",  priority: 0.8 },
    { url: `${BASE}/register/agency`,       lastModified: new Date(), changeFrequency: "monthly",  priority: 0.8 },
    ...agencies
      .filter((a) => a.publicSlug)
      .map((a) => ({
        url: `${BASE}/agencies/${a.publicSlug}`,
        lastModified: a.created_at,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
  ];
}
