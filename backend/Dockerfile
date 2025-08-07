# Use a more specific base image for better caching
FROM python:3.11-slim as builder

# Install system dependencies needed for building wheels in a single layer
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && pip install uv

WORKDIR /app

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies with better caching and parallel processing
RUN uv pip install --system --no-cache . --no-deps && \
    uv pip install --system --no-cache .

# Copy source code
COPY ./src ./src

# Production stage
FROM python:3.11-slim

# Install runtime dependencies only in a single layer
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home appuser

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app/src ./src

# Copy assets directory
COPY ./assets ./assets

# Switch to non-root user
USER appuser

EXPOSE 8080

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]