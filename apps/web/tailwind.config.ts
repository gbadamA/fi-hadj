import type { Config } from "tailwindcss";

const config: Config = {
  presets: [require("@fihadj/design-tokens/tailwind-preset")],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
};

export default config;
