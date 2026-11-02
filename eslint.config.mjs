import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // Salida del servidor de desarrollo (next dev --port 3000 escribe acá).
    // Sin esta línea eslint lintea los bundles generados por webpack.
    ".next-dev/**",
  ]),
]);

export default eslintConfig;
