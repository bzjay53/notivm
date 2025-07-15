#!/bin/bash

# Oracle Cloud VM Auto Creator - Setup Script
# This script helps you set up the notivm project

set -e

echo "🚀 Oracle Cloud VM Auto Creator - Setup"
echo "======================================="
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p docker
echo "✅ Directories created"
echo

# Check if .env file exists
if [ ! -f "config/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp config/.env.template config/.env
    echo "✅ .env file created"
    echo
    echo "⚠️  IMPORTANT: Please edit config/.env file with your Oracle Cloud and Telegram credentials"
    echo "   Required information:"
    echo "   - Oracle Cloud API credentials (User OCID, Tenancy OCID, Fingerprint, Region)"
    echo "   - Telegram Bot Token and Chat ID"
    echo "   - VM configuration settings"
    echo
else
    echo "✅ .env file already exists"
    echo
fi

# Check if OCI private key exists
OCI_KEY_PATH="docker/oci_api_key.pem"
if [ ! -f "$OCI_KEY_PATH" ]; then
    echo "🔑 Oracle Cloud private key not found"
    echo "   Please copy your OCI private key (.pem file) to: $OCI_KEY_PATH"
    echo "   You can download this key from Oracle Cloud Console > Profile > API Keys"
    echo
else
    echo "✅ OCI private key found"
    echo
fi

# Build Docker image
echo "🐳 Building Docker image..."
cd docker
docker-compose build
echo "✅ Docker image built successfully"
echo

# Test configuration (optional)
read -p "🧪 Do you want to test the configuration? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Testing configuration..."
    docker-compose run --rm notivm python src/main.py --mode single --log-level DEBUG
fi

echo
echo "🎉 Setup completed!"
echo
echo "📋 Next steps:"
echo "1. Edit config/.env with your credentials"
echo "2. Copy your OCI private key to docker/oci_api_key.pem"
echo "3. Run: cd docker && docker-compose up -d"
echo "4. Monitor logs: docker-compose logs -f notivm"
echo
echo "📖 For detailed instructions, see README.md"