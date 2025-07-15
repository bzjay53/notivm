import os
import time
import logging
import random
from typing import Dict, Any, Optional
from datetime import datetime
from oci_client import OCIClient
from telegram_bot import TelegramBot

class VMCreator:
    def __init__(self, config: Dict[str, Any]):
        """Initialize VM Creator"""
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Initialize clients
        self.oci_client = OCIClient(config)
        self.telegram_bot = TelegramBot(config)
        
        # 리전별 최적화된 재시도 설정
        self.region = os.getenv("OCI_REGION", "ap-seoul-1")
        region_configs = config.get("region_configs", {})
        region_config = region_configs.get(self.region, {})
        
        # 기본 설정
        default_retry_config = config.get("retry_config", {})
        
        # 리전별 설정으로 오버라이드
        self.max_attempts = region_config.get("max_attempts") or default_retry_config.get("max_attempts", 1000)
        self.initial_wait = region_config.get("retry_interval") or default_retry_config.get("initial_wait", 30)
        self.max_wait = default_retry_config.get("max_wait", 300)
        self.multiplier = default_retry_config.get("multiplier", 1.5)
        
        # 리전 정보 로깅
        if region_config:
            self.logger.info(f"Region-optimized settings for {self.region}: "
                           f"max_attempts={self.max_attempts}, "
                           f"retry_interval={self.initial_wait}s")
        else:
            self.logger.warning(f"No region-specific config for {self.region}, using defaults")
        
        self.logger.info("VM Creator initialized")
    
    def calculate_wait_time(self, attempt: int) -> int:
        """Calculate exponential backoff wait time with jitter"""
        base_wait = min(self.initial_wait * (self.multiplier ** (attempt - 1)), self.max_wait)
        # Add jitter (±20%)
        jitter = base_wait * 0.2 * (random.random() - 0.5)
        wait_time = int(base_wait + jitter)
        return max(wait_time, self.initial_wait)
    
    def wait_for_instance_running(self, instance_id: str, timeout: int = 300) -> bool:
        """Wait for instance to reach running state"""
        self.logger.info(f"Waiting for instance {instance_id} to reach RUNNING state")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                if self.oci_client.is_instance_running(instance_id):
                    self.logger.info(f"Instance {instance_id} is now RUNNING")
                    return True
                
                self.logger.debug(f"Instance {instance_id} not ready yet, waiting...")
                time.sleep(10)
                
            except Exception as e:
                self.logger.error(f"Error checking instance status: {e}")
                time.sleep(10)
        
        self.logger.warning(f"Instance {instance_id} did not reach RUNNING state within {timeout} seconds")
        return False
    
    def create_vm_with_retry(self) -> Optional[Dict[str, Any]]:
        """Main method to create VM with retry logic"""
        self.logger.info("Starting VM creation process")
        
        # Send start notification
        self.telegram_bot.send_start_notification()
        
        # Test bot connection first
        if not self.telegram_bot.test_connection():
            self.logger.error("Telegram bot connection test failed")
            return None
        
        last_error = ""
        
        for attempt in range(1, self.max_attempts + 1):
            try:
                self.logger.info(f"VM creation attempt {attempt}/{self.max_attempts}")
                
                # Send progress notification (every 10 attempts or first few attempts)
                if attempt <= 5 or attempt % 10 == 0:
                    self.telegram_bot.send_progress_notification(attempt, self.max_attempts)
                
                # Generate unique display name
                timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                display_name = f"AutoVM-{timestamp}-{attempt:04d}"
                
                # Attempt to create instance
                instance_details = self.oci_client.create_instance(display_name)
                instance_id = instance_details["instance_id"]
                
                self.logger.info(f"Instance created: {instance_id}")
                
                # Wait for instance to be running
                if self.wait_for_instance_running(instance_id):
                    # Get final instance details with IP addresses
                    final_details = self.oci_client.get_instance_details(instance_id)
                    
                    # Send success notification
                    self.telegram_bot.send_success_notification(final_details)
                    
                    self.logger.info(f"VM creation successful after {attempt} attempts")
                    return final_details
                else:
                    # Instance creation succeeded but didn't reach running state
                    self.logger.warning(f"Instance {instance_id} created but not running, terminating...")
                    self.oci_client.terminate_instance(instance_id)
                    raise Exception("Instance created but failed to reach RUNNING state")
            
            except Exception as e:
                last_error = str(e)
                self.logger.error(f"Attempt {attempt} failed: {last_error}")
                
                # Send error notification for critical errors or every 50 attempts
                if "rate limit" in last_error.lower() or "quota" in last_error.lower() or attempt % 50 == 0:
                    self.telegram_bot.send_error_notification(last_error, attempt)
                
                # If this is not the last attempt, wait before retrying
                if attempt < self.max_attempts:
                    wait_time = self.calculate_wait_time(attempt)
                    self.logger.info(f"Waiting {wait_time} seconds before next attempt...")
                    
                    # Send retry notification for longer waits
                    if wait_time > 60:
                        self.telegram_bot.send_retry_notification(attempt, self.max_attempts, wait_time)
                    
                    time.sleep(wait_time)
        
        # All attempts failed
        self.logger.error(f"All {self.max_attempts} attempts failed. Last error: {last_error}")
        self.telegram_bot.send_final_failure_notification(self.max_attempts, last_error)
        return None
    
    def run_continuous(self) -> None:
        """Run continuous VM creation attempts"""
        self.logger.info("Starting continuous VM creation mode")
        
        while True:
            try:
                result = self.create_vm_with_retry()
                if result:
                    self.logger.info("VM creation successful, stopping continuous mode")
                    break
                else:
                    self.logger.error("VM creation failed after all attempts")
                    # Wait before potentially restarting the entire process
                    self.logger.info("Waiting 300 seconds before restarting the process...")
                    time.sleep(300)
                    
            except KeyboardInterrupt:
                self.logger.info("Received interrupt signal, stopping...")
                self.telegram_bot.send_message("🛑 VM 생성 프로세스가 중단되었습니다.")
                break
            except Exception as e:
                self.logger.error(f"Unexpected error in continuous mode: {e}")
                self.telegram_bot.send_error_notification(f"Unexpected error: {e}")
                # Wait before retrying
                time.sleep(60)
    
    def create_single_vm(self) -> Optional[Dict[str, Any]]:
        """Create a single VM (for testing purposes)"""
        self.logger.info("Creating single VM for testing")
        
        try:
            timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            display_name = f"TestVM-{timestamp}"
            
            instance_details = self.oci_client.create_instance(display_name)
            instance_id = instance_details["instance_id"]
            
            if self.wait_for_instance_running(instance_id):
                final_details = self.oci_client.get_instance_details(instance_id)
                self.telegram_bot.send_success_notification(final_details)
                return final_details
            else:
                self.oci_client.terminate_instance(instance_id)
                raise Exception("Instance failed to reach RUNNING state")
                
        except Exception as e:
            self.logger.error(f"Single VM creation failed: {e}")
            self.telegram_bot.send_error_notification(str(e))
            return None