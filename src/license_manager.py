import os
import hashlib
import platform
import subprocess
import logging
from typing import Optional, Dict, Any
import uuid
import requests
from datetime import datetime

class LicenseManager:
    def __init__(self):
        """Initialize License Manager"""
        self.logger = logging.getLogger(__name__)
        self.license_server_url = os.getenv("LICENSE_SERVER_URL", "https://your-license-server.com/api")
        self.product_id = "ORACLE_VM_HUNTER"
        
    def get_machine_fingerprint(self) -> str:
        """Generate unique machine fingerprint"""
        try:
            # 시스템 정보 수집
            system_info = {
                'platform': platform.system(),
                'processor': platform.processor(),
                'machine': platform.machine(),
                'node': platform.node()
            }
            
            # MAC 주소 추가 (가능한 경우)
            try:
                mac = ':'.join(['{:02x}'.format((uuid.getnode() >> ele) & 0xff) 
                              for ele in range(0,8*6,8)][::-1])
                system_info['mac'] = mac
            except:
                pass
            
            # CPU 정보 추가 (Linux/Mac)
            try:
                if platform.system() == "Linux":
                    with open('/proc/cpuinfo', 'r') as f:
                        cpu_info = f.read()
                        # CPU 모델명 추출
                        for line in cpu_info.split('\n'):
                            if 'model name' in line:
                                system_info['cpu'] = line.split(':')[1].strip()
                                break
                elif platform.system() == "Darwin":  # macOS
                    result = subprocess.run(['sysctl', '-n', 'machdep.cpu.brand_string'], 
                                          capture_output=True, text=True)
                    if result.returncode == 0:
                        system_info['cpu'] = result.stdout.strip()
            except:
                pass
            
            # 정보를 문자열로 변환하고 해시 생성
            info_string = '|'.join(f"{k}:{v}" for k, v in sorted(system_info.items()))
            fingerprint = hashlib.sha256(info_string.encode()).hexdigest()[:16]
            
            self.logger.debug(f"Machine fingerprint generated: {fingerprint}")
            return fingerprint
            
        except Exception as e:
            self.logger.error(f"Error generating machine fingerprint: {e}")
            # 폴백: 단순한 시스템 정보 기반
            fallback = f"{platform.system()}-{platform.machine()}-{platform.node()}"
            return hashlib.md5(fallback.encode()).hexdigest()[:16]
    
    def validate_license_format(self, license_key: str) -> bool:
        """Validate license key format"""
        if not license_key:
            return False
        
        # 예상 형식: ORACLEVM-XXXX-XXXX-XXXX (총 4개 부분)
        parts = license_key.split('-')
        if len(parts) != 4:
            return False
        
        if parts[0] != "ORACLEVM":
            return False
        
        # 각 부분이 4자리 영숫자인지 확인
        for part in parts[1:]:
            if len(part) != 4 or not part.isalnum():
                return False
        
        return True
    
    def validate_license_offline(self, license_key: str, machine_fingerprint: str) -> bool:
        """Offline license validation (기본 구현)"""
        if not self.validate_license_format(license_key):
            return False
        
        # 간단한 오프라인 검증 (실제로는 더 복잡한 알고리즘 사용)
        # 라이센스 키의 마지막 부분이 머신 핑거프린트와 연관되어 있는지 확인
        try:
            expected_suffix = hashlib.md5(f"{self.product_id}-{machine_fingerprint}".encode()).hexdigest()[:4].upper()
            return license_key.endswith(expected_suffix)
        except:
            return False
    
    def validate_license_online(self, license_key: str, machine_fingerprint: str) -> bool:
        """Online license validation"""
        try:
            payload = {
                "product_id": self.product_id,
                "license_key": license_key,
                "machine_fingerprint": machine_fingerprint,
                "timestamp": datetime.now().isoformat()
            }
            
            response = requests.post(
                f"{self.license_server_url}/validate",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("valid", False)
            else:
                self.logger.warning(f"License server returned {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.logger.warning(f"Online license validation failed: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Error in online license validation: {e}")
            return False
    
    def validate_license(self, license_key: str) -> Dict[str, Any]:
        """Validate license with both online and offline methods"""
        result = {
            "valid": False,
            "message": "",
            "method": "",
            "machine_fingerprint": ""
        }
        
        # 기본 형식 검증
        if not self.validate_license_format(license_key):
            result["message"] = "Invalid license key format"
            return result
        
        # 머신 핑거프린트 생성
        machine_fingerprint = self.get_machine_fingerprint()
        result["machine_fingerprint"] = machine_fingerprint
        
        # 온라인 검증 시도
        if self.validate_license_online(license_key, machine_fingerprint):
            result["valid"] = True
            result["method"] = "online"
            result["message"] = "License validated online"
            return result
        
        # 오프라인 검증 시도
        if self.validate_license_offline(license_key, machine_fingerprint):
            result["valid"] = True
            result["method"] = "offline"
            result["message"] = "License validated offline"
            return result
        
        result["message"] = "License validation failed"
        return result
    
    def get_license_from_env(self) -> Optional[str]:
        """Get license key from environment variable"""
        return os.getenv("ORACLE_VM_HUNTER_LICENSE")
    
    def get_license_from_file(self, license_file: str = "license.key") -> Optional[str]:
        """Get license key from file"""
        try:
            if os.path.exists(license_file):
                with open(license_file, 'r') as f:
                    license_key = f.read().strip()
                    return license_key if license_key else None
        except Exception as e:
            self.logger.error(f"Error reading license file: {e}")
        return None
    
    def save_license_to_file(self, license_key: str, license_file: str = "license.key") -> bool:
        """Save license key to file"""
        try:
            with open(license_file, 'w') as f:
                f.write(license_key.strip())
            os.chmod(license_file, 0o600)  # 소유자만 읽기/쓰기
            return True
        except Exception as e:
            self.logger.error(f"Error saving license file: {e}")
            return False
    
    def check_license(self) -> Dict[str, Any]:
        """Check license from multiple sources"""
        # 환경변수에서 시도
        license_key = self.get_license_from_env()
        if license_key:
            self.logger.info("License found in environment variable")
            return self.validate_license(license_key)
        
        # 파일에서 시도
        license_key = self.get_license_from_file()
        if license_key:
            self.logger.info("License found in file")
            return self.validate_license(license_key)
        
        return {
            "valid": False,
            "message": "No license key found",
            "method": "",
            "machine_fingerprint": self.get_machine_fingerprint()
        }
    
    def generate_purchase_info(self) -> Dict[str, str]:
        """Generate information for license purchase"""
        machine_fingerprint = self.get_machine_fingerprint()
        return {
            "product_id": self.product_id,
            "machine_fingerprint": machine_fingerprint,
            "purchase_url": f"https://your-store.com/buy?fp={machine_fingerprint}",
            "contact_email": "support@your-domain.com"
        }

# 편의 함수들
def require_valid_license():
    """Decorator to require valid license"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            license_manager = LicenseManager()
            result = license_manager.check_license()
            
            if not result["valid"]:
                print(f"❌ License Error: {result['message']}")
                print(f"Machine Fingerprint: {result['machine_fingerprint']}")
                
                purchase_info = license_manager.generate_purchase_info()
                print(f"🛒 Purchase License: {purchase_info['purchase_url']}")
                print(f"📧 Support: {purchase_info['contact_email']}")
                
                return None
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def check_license_status():
    """Simple license status check"""
    license_manager = LicenseManager()
    return license_manager.check_license()