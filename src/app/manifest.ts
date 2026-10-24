import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oryvchem — Industrial Chemical Sourcing",
    short_name: "Oryvchem",
    description: "Industrial chemical and raw-material sourcing from Foshan, Guangdong, China.",
    start_url: "/",
    display: "browser",
    background_color: "#E9ECE7",
    theme_color: "#0A161D",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
