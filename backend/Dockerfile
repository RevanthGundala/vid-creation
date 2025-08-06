# backend/Dockerfile

# --- Stage 1: The "Builder" Stage ---
FROM python:3.11-slim as builder

ENV PYTHONUNBUFFERED True
RUN pip install --upgrade pip
RUN pip install uv

WORKDIR /app
COPY pyproject.toml ./
RUN uv pip install --system --no-cache -p .


# --- Stage 2: The "Final" Stage ---
FROM python:3.11-slim

ENV PYTHONUNBUFFERED True

# Create and switch to a non-root user for security
RUN useradd --create-home --shell /bin/bash appuser
USER appuser
WORKDIR /home/appuser

# --- FIX IS HERE ---
# Copy both the Python libraries AND the executables (like uvicorn) from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Now, copy your application code
COPY ./app ./app

# Expose the port the app runs on
EXPOSE 8000