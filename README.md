# Hackfox2026

App con [Expo Router](https://docs.expo.dev/router/introduction/). Solo la carpeta `app/` define rutas y navegación.

## Estructura

```
app/              Rutas (tabs, layouts) — lo que ves en la URL
components/       Pantallas y UI reutilizable (MapScreen, ChatbotScreen, …)
constants/        Config del mapa, teclado, puntos accesibles
hooks/            Hooks compartidos
services/         Google Places, OpenRouteService, Gemini visión, reportes (DB placeholder)
utils/            Helpers (p. ej. parseo de .env)
```

No hace falta `src/`: `app/` es el entry de Expo Router; el resto vive al mismo nivel con imports `@/…`.

## Run

1. `npm install`
2. Copia `.env.example` → `.env` (mapa, Google Places, ORS, `EXPO_PUBLIC_GEMINI_API_KEY`)
3. `npm run start`
4. En Google Cloud, habilita **Places API (New)** para la key de búsqueda. ORS solo calcula rutas.
5. Con ruta activa: **Rerutear** → popup (¿reportar razón?) → opcional cámara → Gemini describe la foto → guardado placeholder en `services/routeReports.ts`.
6. Rutas a pie con polígonos `avoid` (placeholder en `services/routeAvoidances.ts`).

**Foto al rerutear:** solo Gemini multimodal (foto en `inline_data` + texto en el prompt). Lista modelos activos vía API (`gemini-2.5-flash`, etc.). Si falla, descripción manual.
