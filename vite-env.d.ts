/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GROQ_API_KEY: string
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_API_KEY: string
  readonly VITE_CLOUDINARY_API_SECRET: string
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
  readonly VITE_WEATHER_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}