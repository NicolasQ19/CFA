/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // La foto de perfil viaja en el formulario (máx. 2 MB, más el resto de los campos).
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
