import time
from collections import defaultdict, deque
from threading import Lock
from fastapi import Header, HTTPException, Request
from app.core.config import settings


_rate_limiter_lock = Lock()
_rate_limiter_windows = defaultdict(deque)


def enforce_generation_guard(
    request: Request,
    x_api_key: str | None = Header(default=None)
) -> None:
    if settings.API_KEY and x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized request.")

    client_ip = request.client.host if request.client else "unknown"
    route_key = f"{client_ip}:{request.url.path}"
    now = time.time()
    window_seconds = 60

    with _rate_limiter_lock:
        q = _rate_limiter_windows[route_key]
        while q and now - q[0] > window_seconds:
            q.popleft()

        if len(q) >= settings.RATE_LIMIT_PER_MINUTE:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please retry after a minute."
            )
        q.append(now)
