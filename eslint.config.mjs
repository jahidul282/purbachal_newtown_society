import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore generated Prisma client and build artifacts
  { ignores: [
    "lib/generated/**",
    "node_modules/**",
  ] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Local overrides
  {
    rules: {
      // Relax strictness to reduce noise/errors during migration
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["lib/useXlsx.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
