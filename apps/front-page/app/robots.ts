import type { MetadataRoute } from "next";

// Gifting pages (/g/<slug>) are unlisted: crawlers are kept out. The pages also
// send noindex (metadata + X-Robots-Tag) for crawlers that ignore robots.txt.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/g/"] },
  };
}
