# Hackfox2026

App con [Expo Router](https://docs.expo.dev/router/introduction/). Solo la carpeta `app/` define rutas y navegación.

## Estructura

```
app/              Rutas (tabs, layouts) — lo que ves en la URL
components/       Pantallas y UI reutilizable (MapScreen, ChatbotScreen, …)
constants/        Config del mapa, teclado, puntos accesibles
hooks/            Hooks compartidos
services/         OpenRouteService, búsqueda de lugares, zonas a evitar
utils/            Helpers (p. ej. parseo de .env)
```

No hace falta `src/`: `app/` es el entry de Expo Router; el resto vive al mismo nivel con imports `@/…`.

## Run

1. `npm install`
2. Copia `.env.example` → `.env` (`EXPO_PUBLIC_MAP_CENTER`, `EXPO_PUBLIC_ORS_API_KEY`)
3. `npm run start`
4. Rutas a pie con polígonos `avoid` (placeholder en `services/routeAvoidances.ts`)
