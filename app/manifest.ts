import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "H07",
    short_name: "H07",
    description: "Gestión de pedidos, parqueadero, inventario y planes para negocios de lavandería y taller",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d4ed8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
