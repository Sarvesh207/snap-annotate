import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  // basicSsl: self-signed HTTPS so phones on the LAN get a secure context
  // (getUserMedia is blocked on plain http:// except localhost).
  plugins: [react(), tailwindcss(), basicSsl()],
  server: { host: true }, // expose dev server on the local network
});
