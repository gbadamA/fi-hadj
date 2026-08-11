/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les paquets internes sont publiés en TypeScript brut : Next doit les
  // compiler comme du code applicatif plutôt que comme des dépendances.
  transpilePackages: ["@fihadj/design-tokens"],
  images: {
    remotePatterns: [
      // Logos et visuels servis par l'API depuis /uploads.
      { protocol: "http", hostname: "localhost", port: "3051", pathname: "/uploads/**" },
      { protocol: "https", hostname: "**", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
