FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY config/ ./config/

# Create logs directory
RUN mkdir -p logs

# Copy environment file template
COPY config/.env.template ./config/.env

# Set environment variables
ENV PYTHONPATH="/app/src"
ENV PYTHONUNBUFFERED=1

# Expose port for health check
EXPOSE 8080

# Run the application
CMD ["python", "src/main.py"]