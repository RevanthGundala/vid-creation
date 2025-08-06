# backend/Dockerfile

# --- Stage 1: The "Builder" Stage ---
# This stage builds our dependencies using uv.
FROM python:3.11-slim as builder

# Set environment variables and install uv
ENV PYTHONUNBUFFERED True
RUN pip install --upgrade pip
RUN pip install uv

# Create a non-root user for security
RUN useradd --create-home --shell /bin/bash appuser
WORKDIR /home/appuser

# Copy only the project definition file to leverage Docker cache
COPY pyproject.toml ./

# Install dependencies using uv. This is much faster than pip.
# The --system flag installs packages into the global site-packages,
# which is standard practice inside an isolated container.
RUN uv pip install --system --no-cache -p .


# --- Stage 2: The "Final" Stage ---
# This stage creates the lean final image for production.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED True

# Create and switch to the non-root user
RUN useradd --create-home --shell /bin/bash appuser
USER appuser
WORKDIR /home/appuser

# Copy the installed packages from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Now, copy your application code
COPY ./app ./app

# Expose the port the app runs on
EXPOSE 8080

# The command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]