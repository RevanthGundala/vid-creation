FROM python:3.11-slim as builder

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv
RUN uv sync --no-install-project

COPY ./src ./src

FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app/src ./src

RUN useradd --create-home appuser
USER appuser

EXPOSE 8080

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
