from __future__ import annotations

import os
import secrets
from dataclasses import dataclass
from typing import Optional
from pathlib import Path


@dataclass
class Config:
    # Root and directories
    ROOT_DIR: Path
    VIDEO_UPLOAD_DIR: Path
    VIDEO_HLS_DIR: Path
    VIDEO_PLAYLIST_FILE: Path

    MUSIC_UPLOAD_DIR: Path
    MUSIC_HLS_DIR: Path
    MUSIC_PLAYLIST_FILE: Path

    # Public URL prefixes
    VIDEO_HLS_PUBLIC_PREFIX: str = "/video-hls"
    VIDEO_ORIG_PUBLIC_PREFIX: str = "/video-upload"
    MUSIC_HLS_PUBLIC_PREFIX: str = "/music-hls"
    MUSIC_ORIG_PUBLIC_PREFIX: str = "/music-upload"

    # Transcode options
    FFMPEG_TIMEOUT_SECONDS: int = 900
    FFMPEG_LOGLEVEL: str = "error"
    STRATEGY: str = "auto"  # auto|copy|transcode
    FORCE_REENCODE: bool = False
    VERBOSE: bool = True

    # Scan management endpoint auth (recommended for production)
    SCAN_AUTH_REQUIRED: bool = True
    SCAN_API_TOKEN: str = ""

    # Frontend (static export) settings
    FRONTEND_ENABLE: bool = True
    FRONTEND_AUTO_START: bool = False  # static mode: no server to start
    FRONTEND_PORT: int = 3000  # unused in static mode
    FRONTEND_NODE: str = "node"  # unused in static mode
    FRONTEND_SITE_DIR: Optional[Path] = None

    @staticmethod
    def from_env() -> "Config":
        backend_dir = Path(__file__).resolve().parent
        root = backend_dir.parent

        def getenv_path(key: str, default: Path) -> Path:
            val = os.getenv(key)
            return Path(val) if val else default

        cfg = Config(
            ROOT_DIR=root,
            VIDEO_UPLOAD_DIR=getenv_path("VIDEO_UPLOAD_DIR", root / "video-upload"),
            VIDEO_HLS_DIR=getenv_path("VIDEO_HLS_DIR", root / "video-hls"),
            VIDEO_PLAYLIST_FILE=getenv_path("VIDEO_PLAYLIST_FILE", root / "video-playlist" / "playlist.json"),

            MUSIC_UPLOAD_DIR=getenv_path("MUSIC_UPLOAD_DIR", root / "music-upload"),
            MUSIC_HLS_DIR=getenv_path("MUSIC_HLS_DIR", root / "music-hls"),
            MUSIC_PLAYLIST_FILE=getenv_path("MUSIC_PLAYLIST_FILE", root / "music-playlist" / "playlist.json"),
        )

        # Prefixes
        cfg.VIDEO_HLS_PUBLIC_PREFIX = os.getenv("HLS_PUBLIC_PREFIX", os.getenv("VIDEO_HLS_PUBLIC_PREFIX", cfg.VIDEO_HLS_PUBLIC_PREFIX)).rstrip("/")
        cfg.VIDEO_ORIG_PUBLIC_PREFIX = os.getenv("ORIG_PUBLIC_PREFIX", os.getenv("VIDEO_ORIG_PUBLIC_PREFIX", cfg.VIDEO_ORIG_PUBLIC_PREFIX)).rstrip("/")
        cfg.MUSIC_HLS_PUBLIC_PREFIX = os.getenv("MUSIC_HLS_PUBLIC_PREFIX", cfg.MUSIC_HLS_PUBLIC_PREFIX).rstrip("/")
        cfg.MUSIC_ORIG_PUBLIC_PREFIX = os.getenv("MUSIC_ORIG_PUBLIC_PREFIX", cfg.MUSIC_ORIG_PUBLIC_PREFIX).rstrip("/")

        # Other
        cfg.FFMPEG_TIMEOUT_SECONDS = int(os.getenv("FFMPEG_TIMEOUT_SECONDS", str(cfg.FFMPEG_TIMEOUT_SECONDS)))
        cfg.FFMPEG_LOGLEVEL = os.getenv("FFMPEG_LOGLEVEL", cfg.FFMPEG_LOGLEVEL)
        cfg.STRATEGY = os.getenv("STRATEGY", cfg.STRATEGY).lower()
        cfg.FORCE_REENCODE = os.getenv("FORCE_REENCODE", "0") in ("1", "true", "True")
        cfg.VERBOSE = os.getenv("VERBOSE", "1") not in ("0", "false", "False")
        cfg.SCAN_AUTH_REQUIRED = os.getenv("SCAN_AUTH_REQUIRED", "1") not in ("0", "false", "False")
        cfg.SCAN_API_TOKEN = (os.getenv("SCAN_API_TOKEN") or "").strip()

        # Auto-discover token file at repo default path to avoid extra env config.
        # Compatibility: SCAN_API_TOKEN_FILE can still override the file path when needed.
        token_file_raw = os.getenv("SCAN_API_TOKEN_FILE")
        token_file = Path(token_file_raw) if token_file_raw else (root / ".secrets" / "scan_api_token")
        if cfg.SCAN_AUTH_REQUIRED:
            if token_file.exists():
                try:
                    file_token = token_file.read_text(encoding="utf-8").strip()
                except Exception as e:
                    raise RuntimeError(f"failed to read scan token file: {token_file}") from e
                if file_token:
                    # Prefer persisted file token for stable behavior across restarts.
                    cfg.SCAN_API_TOKEN = file_token
                else:
                    token_to_write = cfg.SCAN_API_TOKEN or secrets.token_urlsafe(32)
                    try:
                        token_file.parent.mkdir(parents=True, exist_ok=True)
                        token_file.write_text(token_to_write, encoding="utf-8")
                    except Exception as e:
                        raise RuntimeError(f"failed to write scan token file: {token_file}") from e
                    cfg.SCAN_API_TOKEN = token_to_write
            else:
                token_to_write = cfg.SCAN_API_TOKEN or secrets.token_urlsafe(32)
                try:
                    token_file.parent.mkdir(parents=True, exist_ok=True)
                    token_file.write_text(token_to_write, encoding="utf-8")
                except Exception as e:
                    raise RuntimeError(f"failed to create scan token file: {token_file}") from e
                cfg.SCAN_API_TOKEN = token_to_write

        # Frontend settings (static site)
        cfg.FRONTEND_ENABLE = os.getenv("FRONTEND_ENABLE", "1") not in ("0", "false", "False")
        cfg.FRONTEND_AUTO_START = False
        cfg.FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", str(cfg.FRONTEND_PORT)))
        cfg.FRONTEND_NODE = os.getenv("FRONTEND_NODE", cfg.FRONTEND_NODE)
        cfg.FRONTEND_SITE_DIR = getenv_path("FRONTEND_SITE_DIR", root / "assets")

        # Ensure directories exist
        cfg.VIDEO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cfg.VIDEO_HLS_DIR.mkdir(parents=True, exist_ok=True)
        cfg.VIDEO_PLAYLIST_FILE.parent.mkdir(parents=True, exist_ok=True)

        cfg.MUSIC_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cfg.MUSIC_HLS_DIR.mkdir(parents=True, exist_ok=True)
        cfg.MUSIC_PLAYLIST_FILE.parent.mkdir(parents=True, exist_ok=True)

        return cfg
