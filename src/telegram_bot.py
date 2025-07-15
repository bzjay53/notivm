import os
import requests
import logging
from typing import Dict, Any, Optional
from datetime import datetime

class TelegramBot:
    def __init__(self, config: Dict[str, Any]):
        """Initialize Telegram bot"""
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        
        if not self.bot_token or not self.chat_id:
            raise ValueError("Telegram bot token and chat ID must be provided")
        
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
        self.logger.info("Telegram bot initialized")
    
    def send_message(self, message: str, parse_mode: str = "Markdown") -> bool:
        """Send a message to the configured chat"""
        try:
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": parse_mode
            }
            
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            self.logger.info("Message sent successfully")
            return True
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to send message: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error sending message: {e}")
            return False
    
    def send_progress_notification(self, attempt: int, max_attempts: int) -> bool:
        """Send progress notification"""
        message = self.config["notification_config"]["progress_message"].format(
            attempt=attempt,
            max_attempts=max_attempts
        )
        return self.send_message(message)
    
    def send_success_notification(self, instance_details: Dict[str, Any]) -> bool:
        """Send success notification with instance details"""
        public_ip = instance_details.get("public_ip", "N/A")
        private_ip = instance_details.get("private_ip", "N/A")
        created_time = instance_details.get("time_created", datetime.now())
        
        if isinstance(created_time, str):
            try:
                created_time = datetime.fromisoformat(created_time.replace('Z', '+00:00'))
            except:
                created_time = datetime.now()
        
        message = self.config["notification_config"]["success_message"].format(
            instance_name=instance_details.get("display_name", "Unknown"),
            public_ip=public_ip,
            private_ip=private_ip,
            created_time=created_time.strftime("%Y-%m-%d %H:%M:%S"),
            instance_id=instance_details.get("instance_id", "Unknown"),
            shape=instance_details.get("shape", "Unknown"),
            availability_domain=instance_details.get("availability_domain", "Unknown")
        )
        
        # Add additional details
        details = f"""
*Instance Details:*
• **ID**: `{instance_details.get("instance_id", "Unknown")}`
• **Name**: {instance_details.get("display_name", "Unknown")}
• **Shape**: {instance_details.get("shape", "Unknown")}
• **Public IP**: `{public_ip}`
• **Private IP**: `{private_ip}`
• **Availability Domain**: {instance_details.get("availability_domain", "Unknown")}
• **Status**: {instance_details.get("lifecycle_state", "Unknown")}
• **Created**: {created_time.strftime("%Y-%m-%d %H:%M:%S")}

🎉 **VM이 성공적으로 생성되었습니다!**
"""
        
        return self.send_message(details)
    
    def send_error_notification(self, error_message: str, attempt: Optional[int] = None) -> bool:
        """Send error notification"""
        if attempt:
            message = f"❌ **VM 생성 실패** (시도 #{attempt})\n\n`{error_message}`"
        else:
            message = self.config["notification_config"]["error_message"].format(
                error_message=error_message
            )
        return self.send_message(message)
    
    def send_start_notification(self) -> bool:
        """Send notification when VM creation process starts"""
        message = """
🚀 **Oracle Cloud VM 자동 생성 시작**

• Shape: VM.Standard.A1.Flex
• vCPUs: 2
• Memory: 12GB
• Storage: 50GB

⏳ VM 생성을 시도합니다...
"""
        return self.send_message(message)
    
    def send_retry_notification(self, attempt: int, max_attempts: int, next_retry_in: int) -> bool:
        """Send retry notification with wait time"""
        message = f"""
⏳ **재시도 대기 중** ({attempt}/{max_attempts})

다음 시도까지: {next_retry_in}초
계속해서 VM 생성을 시도합니다...
"""
        return self.send_message(message)
    
    def send_final_failure_notification(self, max_attempts: int, last_error: str) -> bool:
        """Send final failure notification when all attempts are exhausted"""
        message = f"""
💥 **VM 생성 최종 실패**

• 총 시도 횟수: {max_attempts}
• 마지막 오류: `{last_error}`

VM 생성에 실패했습니다. 설정을 확인하고 다시 시도해주세요.
"""
        return self.send_message(message)
    
    def test_connection(self) -> bool:
        """Test Telegram bot connection"""
        try:
            url = f"{self.base_url}/getMe"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data.get("ok"):
                bot_info = data.get("result", {})
                self.logger.info(f"Bot connection test successful: @{bot_info.get('username', 'unknown')}")
                return True
            else:
                self.logger.error("Bot connection test failed")
                return False
                
        except Exception as e:
            self.logger.error(f"Bot connection test error: {e}")
            return False