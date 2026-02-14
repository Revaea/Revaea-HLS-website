# Worker

Keeps the existing public endpoints while serving data from R2.

## Endpoints

- `GET /api/health`
- `GET /api/video/playlist` -> `video-playlist/playlist.json` in R2
- `GET /api/music/playlist` -> `music-playlist/playlist.json` in R2
- `GET /video-hls/*` -> `video-hls/*` in R2
- `GET /music-hls/*` -> `music-hls/*` in R2

`POST /api/scan/*` returns `501` (scan is local-only in this mode).

## Setup

1. Install dependencies

```bash
cd worker
pnpm install
```

2. Edit `wrangler.toml`

- Set `name`
- Set `CORS_ALLOW_ORIGINS`
- Ensure the bucket name is `hls-playlist` (or change it to your actual bucket)

3. Authenticate wrangler

```bash
pnpm wrangler login
```

4. Deploy

```bash
pnpm deploy
```
