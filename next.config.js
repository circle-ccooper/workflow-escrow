const { CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET } = process.env;

if (!CIRCLE_API_KEY?.trim()) {
  throw new Error("CIRCLE_API_KEY environment variable is missing or empty");
}

if (!CIRCLE_ENTITY_SECRET?.trim()) {
  throw new Error("CIRCLE_ENTITY_SECRET environment variable is missing or empty");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

module.exports = nextConfig;
