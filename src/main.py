#!/usr/bin/env python3
import os
import sys
import logging
import yaml
import argparse
import signal
from pathlib import Path
from dotenv import load_dotenv
from vm_creator import VMCreator
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import json
from datetime import datetime

class HealthCheckHandler(BaseHTTPRequestHandler):
    """Simple health check handler for Docker"""
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'status': 'healthy',
                'service': 'notivm',
                'timestamp': str(datetime.now())
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Suppress default log messages
        pass

class NotivmApp:
    def __init__(self):
        self.vm_creator = None
        self.health_server = None
        self.logger = None
        self.running = True
        
    def setup_logging(self, log_level: str = "INFO", log_file: str = None):
        """Setup logging configuration"""
        # Create logs directory if it doesn't exist
        if log_file:
            log_dir = Path(log_file).parent
            log_dir.mkdir(parents=True, exist_ok=True)
        
        # Configure logging
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        date_format = "%Y-%m-%d %H:%M:%S"
        
        handlers = [logging.StreamHandler(sys.stdout)]
        if log_file:
            handlers.append(logging.FileHandler(log_file))
        
        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format=log_format,
            datefmt=date_format,
            handlers=handlers
        )
        
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"Logging initialized - Level: {log_level}, File: {log_file}")
    
    def load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                config = yaml.safe_load(file)
            self.logger.info(f"Configuration loaded from {config_path}")
            return config
        except FileNotFoundError:
            self.logger.error(f"Configuration file not found: {config_path}")
            sys.exit(1)
        except yaml.YAMLError as e:
            self.logger.error(f"Error parsing configuration file: {e}")
            sys.exit(1)
    
    def validate_environment(self):
        """Validate required environment variables"""
        required_vars = [
            "OCI_USER_OCID",
            "OCI_TENANCY_OCID",
            "OCI_REGION",
            "OCI_FINGERPRINT",
            "OCI_PRIVATE_KEY_PATH",
            "TELEGRAM_BOT_TOKEN",
            "TELEGRAM_CHAT_ID"
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            self.logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
            self.logger.error("Please check your .env file and ensure all required variables are set")
            sys.exit(1)
        
        # Check if OCI private key file exists
        key_path = os.getenv("OCI_PRIVATE_KEY_PATH")
        if not os.path.exists(key_path):
            self.logger.error(f"OCI private key file not found: {key_path}")
            sys.exit(1)
        
        self.logger.info("Environment validation passed")
    
    def start_health_server(self, port: int = 8080):
        """Start health check HTTP server"""
        try:
            server_address = ('', port)
            self.health_server = HTTPServer(server_address, HealthCheckHandler)
            
            # Start server in a separate thread
            server_thread = threading.Thread(
                target=self.health_server.serve_forever,
                daemon=True
            )
            server_thread.start()
            self.logger.info(f"Health check server started on port {port}")
            
        except Exception as e:
            self.logger.warning(f"Failed to start health check server: {e}")
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
        if self.health_server:
            self.health_server.shutdown()
        sys.exit(0)
    
    def run(self, mode: str = "continuous"):
        """Main application run method"""
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Load environment variables
        env_file = os.getenv("ENV_FILE", "/app/config/.env")
        if os.path.exists(env_file):
            load_dotenv(env_file)
            self.logger.info(f"Environment variables loaded from {env_file}")
        else:
            self.logger.warning(f"Environment file not found: {env_file}, using system environment")
        
        # Validate environment
        self.validate_environment()
        
        # Load configuration
        config_path = "/app/config/config.yaml"
        config = self.load_config(config_path)
        
        # Start health check server
        self.start_health_server()
        
        # Initialize VM Creator
        self.vm_creator = VMCreator(config)
        
        # Run based on mode
        if mode == "continuous":
            self.logger.info("Starting continuous VM creation mode")
            self.vm_creator.run_continuous()
        elif mode == "single":
            self.logger.info("Creating single VM")
            result = self.vm_creator.create_single_vm()
            if result:
                self.logger.info("Single VM creation completed successfully")
            else:
                self.logger.error("Single VM creation failed")
                sys.exit(1)
        else:
            self.logger.error(f"Unknown mode: {mode}")
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Oracle Cloud VM Auto Creator")
    parser.add_argument(
        "--mode", 
        choices=["continuous", "single"], 
        default="continuous",
        help="Execution mode: continuous (default) or single VM creation"
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Logging level (default: INFO)"
    )
    parser.add_argument(
        "--log-file",
        default="/app/logs/notivm.log",
        help="Log file path (default: /app/logs/notivm.log)"
    )
    
    args = parser.parse_args()
    
    # Initialize application
    app = NotivmApp()
    app.setup_logging(args.log_level, args.log_file)
    
    try:
        app.run(args.mode)
    except KeyboardInterrupt:
        app.logger.info("Application interrupted by user")
    except Exception as e:
        app.logger.error(f"Application error: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()