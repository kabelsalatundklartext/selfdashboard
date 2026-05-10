FROM python:3.12-slim
LABEL org.opencontainers.image.source=https://github.com/kabelsalatundklartext/selfdashboard
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    apt-get update && apt-get install -y --no-install-recommends tzdata && rm -rf /var/lib/apt/lists/*
COPY . .
EXPOSE 4001
HEALTHCHECK --interval=20s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:4001/health')"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4001", "--workers", "2"]
