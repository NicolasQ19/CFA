import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // El lint se corre aparte con `npm run lint`: así un aviso de estilo no
    // frena un despliegue. La verificación de tipos y el build siguen igual.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      // CV (5 MB), foto (2 MB) y campos del formulario.
      bodySizeLimit: "8mb",
    },
  },
};

export default function configurarNext(phase) {
  return {
    ...nextConfig,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
