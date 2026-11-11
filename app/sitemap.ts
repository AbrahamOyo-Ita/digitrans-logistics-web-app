import type { MetadataRoute } from "next";
import { services } from "@/lib/content";
import { articles } from "@/lib/articles";

const base = "https://digitrans.ng";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/services", "/pricing", "/coverage", "/about", "/contact", "/quote", "/track", "/insights"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const servicePages = services.map((service) => ({
    url: `${base}/services/${service.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const articlePages = articles.map((article) => ({
    url: `${base}/insights/${article.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...servicePages, ...articlePages];
}
