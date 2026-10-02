/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // CV (5 MB), foto (2 MB) y campos del formulario.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
