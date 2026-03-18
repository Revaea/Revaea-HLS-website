from __future__ import annotations
import hmac
from quart import Blueprint, jsonify, current_app, request  # type: ignore
import time
from .config import Config
from .services.video import scan_and_convert_videos
from .services.music import scan_and_convert_music


bp = Blueprint('api', __name__)


def get_cfg() -> Config:
    return current_app.config['APP_CONFIG']


def _extract_bearer_token(auth_header: str | None) -> str | None:
    if not auth_header:
        return None
    prefix = 'Bearer '
    if auth_header.startswith(prefix):
        token = auth_header[len(prefix):].strip()
        return token or None
    return None


def _extract_scan_token_from_request() -> str | None:
    token = _extract_bearer_token(request.headers.get('Authorization'))
    if token:
        return token
    token = (request.headers.get('X-Scan-Token') or '').strip()
    if token:
        return token
    token = (request.args.get('token') or '').strip()
    return token or None


def _check_scan_auth():
    cfg = get_cfg()
    if not cfg.SCAN_AUTH_REQUIRED:
        return None
    if not cfg.SCAN_API_TOKEN:
        return jsonify({'error': 'scan auth is enabled but SCAN_API_TOKEN is not configured'}), 503
    provided = _extract_scan_token_from_request()
    if not provided or not hmac.compare_digest(provided, cfg.SCAN_API_TOKEN):
        return jsonify({'error': 'unauthorized'}), 401
    return None


@bp.get('/health')
async def health():
    return jsonify({'status': 'ok'})


@bp.get('/video/playlist')
async def get_video_playlist():
    cfg = get_cfg()
    try:
        text = cfg.VIDEO_PLAYLIST_FILE.read_text(encoding='utf-8')
        # Validate JSON to avoid propagating corrupt files
        import json as _json
        data = _json.loads(text)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify([])
    except Exception as e:  # pragma: no cover
        current_app.logger.exception("read video playlist failed: %s", e)
        return jsonify([])


@bp.post('/scan/video')
async def scan_video():
    denied = _check_scan_auth()
    if denied is not None:
        return denied

    cfg = get_cfg()
    app = current_app
    lock = app.scan_locks['video']
    now = time.time()
    last = app.scan_last.get('video', 0.0)
    debounce = app.config.get('SCAN_DEBOUNCE_SECONDS', 10)

    # 正在运行
    if lock.locked():
        return jsonify({'error': 'video scan is already running'}), 409
    # 防抖
    if last and (now - last) < debounce:
        wait_sec = max(0, int(debounce - (now - last)))
        return jsonify({'error': f'video scan debounced, retry in ~{wait_sec}s'}), 429
    lines: list[str] = []

    def log(line: str):
        lines.append(line)
        current_app.logger.info(line)

    async with lock:
        app.scan_last['video'] = time.time()
        result = await scan_and_convert_videos(cfg, log=log)
    return jsonify({'result': result, 'logs': lines[-200:]})


@bp.get('/music/playlist')
async def get_music_playlist():
    cfg = get_cfg()
    try:
        text = cfg.MUSIC_PLAYLIST_FILE.read_text(encoding='utf-8')
        import json as _json
        data = _json.loads(text)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify([])
    except Exception as e:  # pragma: no cover
        current_app.logger.exception("read music playlist failed: %s", e)
        return jsonify([])


@bp.post('/scan/music')
async def scan_music():
    denied = _check_scan_auth()
    if denied is not None:
        return denied

    cfg = get_cfg()
    app = current_app
    lock = app.scan_locks['music']
    now = time.time()
    last = app.scan_last.get('music', 0.0)
    debounce = app.config.get('SCAN_DEBOUNCE_SECONDS', 10)

    # 正在运行
    if lock.locked():
        return jsonify({'error': 'music scan is already running'}), 409
    # 防抖
    if last and (now - last) < debounce:
        wait_sec = max(0, int(debounce - (now - last)))
        return jsonify({'error': f'music scan debounced, retry in ~{wait_sec}s'}), 429
    lines: list[str] = []

    def log(line: str):
        lines.append(line)
        current_app.logger.info(line)

    async with lock:
        app.scan_last['music'] = time.time()
        result = await scan_and_convert_music(cfg, log=log)
    return jsonify({'result': result, 'logs': lines[-200:]})
