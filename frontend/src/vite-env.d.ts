/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_USER: string;
  readonly VITE_AUTH_PASSWORD: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
