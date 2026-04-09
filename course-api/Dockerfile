# syntax=docker/dockerfile:1.6
FROM python:3.11-slim AS base

# System deps needed by shapely (libgeos). Kept minimal to shrink the image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgeos-c1v5 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and the runtime directory up front.
RUN useradd --system --create-home --uid 1001 --user-group app \
    && mkdir -p /app /app/data/cache \
    && chown -R app:app /app

WORKDIR /app

# Install Python deps first so we cache them independently of source changes.
COPY --chown=app:app requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the service source.
COPY --chown=app:app . .

# Ensure the cache directory is writable by the non-root user. The COPY
# above can clobber ownership of existing data/ in the source tree.
RUN mkdir -p /app/data/cache && chown -R app:app /app/data

# Runtime environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production \
    PORT=8001

USER app
EXPOSE 8001

# Container-level healthcheck (Fly also runs its own HTTP check; this is a backup).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request,sys; \
    sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8001/health', timeout=3).status==200 else 1)" \
    || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--proxy-headers", "--forwarded-allow-ips=*"]
