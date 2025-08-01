# 🚀 Oracle Cloud VM Auto Creator (notivm)

Oracle Cloud Infrastructure의 ARM 기반 VM.Standard.A1.Flex 인스턴스를 자동으로 생성하고 텔레그램으로 알림을 전송하는 경량화된 도구입니다.

## 📋 프로젝트 개요

- **목표**: Oracle Cloud의 무료 ARM VM 자동 생성
- **특징**: 지수 백오프 재시도, 텔레그램 실시간 알림, Docker 기반 배포
- **참조**: [Oracle Cloud Ampere 자동 생성 가이드](https://marinesnow34.github.io/2025/02/03/oracle-cloud-ampere/)

## 🏗️ 아키텍처

```
notivm/
├── config/
│   ├── config.yaml          # 메인 설정
│   ├── .env.template        # 환경변수 템플릿
│   └── .env                 # 실제 환경변수 (생성 필요)
├── src/
│   ├── oci_client.py        # Oracle Cloud API 클라이언트
│   ├── telegram_bot.py      # 텔레그램 알림 봇
│   ├── vm_creator.py        # VM 생성 로직 및 재시도
│   └── main.py              # 메인 실행 파일
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── oci_api_key.pem      # OCI 개인키 (복사 필요)
├── scripts/
│   └── setup.sh             # 자동 설정 스크립트
└── logs/                    # 로그 파일 저장
```

## 📋 사전 준비사항

### 1. Oracle Cloud 계정 설정

#### 1.1 리전 선택 전략 ⚡ (매우 중요!)
**⚠️ 주의: 리전은 계정 생성 시 한 번만 선택 가능하며 변경 불가능합니다!**

##### 🏃‍♂️ 빠른 생성 리전 (적극 권장)
1. **US West (Phoenix)** - 최고 속도
   - 평균 대기시간: 3-7일
   - 성공률: 90%+
   - 네트워크 지연: 180-200ms (한국 기준)
   - 권장 대상: 빠른 생성이 최우선인 경우

2. **US East (Ashburn)** - 안정적
   - 평균 대기시간: 5-10일
   - 성공률: 85%+
   - 네트워크 지연: 200-250ms

##### ⚡ 균형형 리전 (성능 vs 속도)
3. **Japan East (Tokyo)** 🇯🇵 - **한국 사용자 추천**
   - 평균 대기시간: 1-3주
   - 성공률: 70-80%
   - 네트워크 지연: 30-60ms
   - 권장 대상: 서비스 운영용, 최적 성능 필요

4. **Japan Central (Osaka)** 🇯🇵 - 도쿄 대안
   - 평균 대기시간: 2-4주
   - 성공률: 60-75%
   - 네트워크 지연: 40-70ms

5. **Singapore** 🇸🇬
   - 평균 대기시간: 2-4주
   - 성공률: 65-75%
   - 네트워크 지연: 80-120ms

##### 🐌 느린 리전 (비추천)
6. **South Korea Central (Seoul)** 🇰🇷
   - 평균 대기시간: 4-8주+ (최악 12주)
   - 성공률: 30-50%
   - 네트워크 지연: 5-15ms (최적이지만 생성 거의 불가능)

##### 📊 용도별 리전 선택 가이드
```
🎯 개발/테스트 환경: US West (Phoenix)
   → 빠른 생성 > 성능

🎯 프로덕션/서비스: Japan East (Tokyo)
   → 사용자 경험 > 생성 속도

🎯 균형형 (추천): Japan East (Tokyo) 또는 Singapore
   → 적절한 타협점
```

#### 1.2 계정 생성 단계별 가이드
1. **Oracle Cloud 접속**: [cloud.oracle.com/free](https://cloud.oracle.com/free)
2. **국가 선택**: 실제 거주 국가 선택 (한국)
3. **리전 선택**: 위 가이드에 따라 신중하게 선택
4. **개인정보 입력**: 
   - ⚠️ **실제 정보만 입력** (가짜 정보 시 계정 승인 거부)
   - 실명, 실제 주소, 실제 전화번호 필수
5. **신용카드 등록**: 
   - 본인 명의 카드 필수
   - 요금은 부과되지 않음 (Free Tier)
6. **SMS 인증**: 실제 사용 가능한 번호로 인증
7. **계정 활성화 대기**: 24-48시간 소요

#### 1.3 API 키 생성
1. 계정 로그인 후 우상단 프로필 클릭 → **My Profile**
2. 좌측 메뉴에서 **API Keys** 클릭
3. **Add API Key** 클릭
4. **Generate API Key Pair** 선택
5. **Download Private Key** 클릭 
   - ⚠️ **매우 중요**: 이 파일을 절대 잃어버리지 마세요!
6. **Add** 클릭
7. **Configuration Preview** 내용을 복사해서 저장

#### 1.4 필수 정보 수집 체크리스트
```bash
✅ User OCID: ocid1.user.oc1..aaaaaaaa...
✅ Tenancy OCID: ocid1.tenancy.oc1..aaaaaaaa...
✅ Region: (선택한 리전 예: ap-tokyo-1)
✅ Fingerprint: xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
✅ Private Key 파일: oci_api_key.pem (다운로드 완료)
```

### 2. 텔레그램 봇 설정

#### 2.1 봇 생성
1. 텔레그램에서 `@BotFather` 검색
2. `/newbot` 명령 실행
3. 봇 이름 입력 (예: `Oracle VM Creator`)
4. 봇 사용자명 입력 (예: `oracle_vm_creator_bot`)
5. **Bot Token** 저장 (예: `123456789:ABCdef...`)

#### 2.2 Chat ID 획득
1. 생성된 봇과 대화 시작
2. 아무 메시지나 전송
3. 브라우저에서 다음 URL 접속:
   ```
   https://api.telegram.org/bot[BOT_TOKEN]/getUpdates
   ```
4. `"chat":{"id": 숫자}` 에서 숫자가 Chat ID

### 3. 서버 환경 확인
```bash
# Docker 설치 확인
docker --version
docker-compose --version

# 필요시 Docker 설치 (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

## 🛠️ 설치 및 설정

### 1. 프로젝트 이동
```bash
cd /root/dev/notivm
```

### 2. 자동 설정 실행
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. 환경변수 설정
```bash
# .env 파일 편집
nano config/.env
```

다음 정보를 입력 (위에서 수집한 정보):
```bash
# Oracle Cloud Infrastructure Configuration
OCI_USER_OCID=ocid1.user.oc1..aaaaaaaa...
OCI_TENANCY_OCID=ocid1.tenancy.oc1..aaaaaaaa...
OCI_REGION=ap-tokyo-1  # 또는 선택한 리전
OCI_FINGERPRINT=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
OCI_PRIVATE_KEY_PATH=/app/config/oci_api_key.pem

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
TELEGRAM_CHAT_ID=123456789

# VM Configuration
VM_SHAPE=VM.Standard.A1.Flex
VM_OCPUS=2
VM_MEMORY_GB=12
VM_BOOT_VOLUME_SIZE_GB=50
VM_DISPLAY_NAME=AutoCreated-VM
VM_COMPARTMENT_OCID=  # 비워두면 root compartment 사용

# Retry Configuration
MAX_RETRY_ATTEMPTS=1000
RETRY_INTERVAL_SECONDS=30
EXPONENTIAL_BACKOFF=true

# Logging
LOG_LEVEL=INFO
LOG_FILE=/app/logs/notivm.log
```

### 4. OCI 개인키 복사
```bash
# Oracle Cloud에서 다운받은 .pem 파일을 복사
cp ~/Downloads/your-api-key.pem docker/oci_api_key.pem
chmod 600 docker/oci_api_key.pem
```

## 🚀 실행 방법

### 1. 지속적 VM 생성 모드 (권장)
```bash
cd docker
docker-compose up -d
```

### 2. 단일 VM 생성 테스트
```bash
cd docker
docker-compose run --rm notivm python src/main.py --mode single
```

### 3. 로그 모니터링
```bash
# 실시간 로그 확인
docker-compose logs -f notivm

# 로그 파일 확인
tail -f ../logs/notivm.log
```

### 4. 서비스 제어
```bash
# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart notivm

# 상태 확인
docker-compose ps
```

## 📱 텔레그램 알림 예시

### 시작 알림
```
🚀 Oracle Cloud VM 자동 생성 시작

• Shape: VM.Standard.A1.Flex
• vCPUs: 2
• Memory: 12GB
• Storage: 50GB

⏳ VM 생성을 시도합니다...
```

### 성공 알림
```
🎉 Instance Details:
• ID: ocid1.instance.oc1...
• Name: AutoVM-20250715-1234-0042
• Shape: VM.Standard.A1.Flex
• Public IP: 140.238.xxx.xxx
• Private IP: 10.0.0.xxx
• Availability Domain: wxyz:AP-TOKYO-1-AD-1
• Status: RUNNING
• Created: 2025-07-15 12:34:56

🎉 VM이 성공적으로 생성되었습니다!
```

### 재시도 알림
```
⏳ 재시도 대기 중 (42/1000)

다음 시도까지: 120초
계속해서 VM 생성을 시도합니다...
```

## ⚙️ 리전별 최적화 설정

### 리전별 예상 소요 시간 ⏰
```
🤖 자동화 도구 사용 시:
- US Phoenix: 3-7일
- US Ashburn: 5-10일
- Japan Tokyo: 1-3주
- Japan Osaka: 2-4주
- Singapore: 2-4주
- Korea Seoul: 4-8주+ (비추천)

👆 수동 시도 시:
- 하루 50-100회 클릭 필요
- 24/7 모니터링 필요
- 성공률 1-3%
- 실제 성공까지 몇 달 소요 가능
```

### VM 사양 변경
`config/.env` 파일에서 다음 값들을 수정:
```bash
VM_OCPUS=4                    # vCPU 개수 (최대 4)
VM_MEMORY_GB=24               # 메모리 (최대 24GB)
VM_BOOT_VOLUME_SIZE_GB=200    # 부트 볼륨 크기 (최대 200GB)
```

### 재시도 설정 변경
```bash
MAX_RETRY_ATTEMPTS=500        # 최대 시도 횟수
RETRY_INTERVAL_SECONDS=60     # 초기 대기 시간
```

### 로깅 레벨 변경
```bash
LOG_LEVEL=DEBUG               # DEBUG, INFO, WARNING, ERROR
```

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. "ServiceError: 401 Unauthorized"
- OCI API 키 설정 확인
- Fingerprint 정확성 검증
- 개인키 파일 경로 및 권한 확인
- User OCID가 올바른지 확인

#### 2. "Telegram bot connection failed"
- Bot Token 정확성 확인
- Chat ID 정확성 확인
- 인터넷 연결 상태 확인
- 봇이 차단되지 않았는지 확인

#### 3. "No availability domains found"
- 선택한 리전에 A1 인스턴스 가용성 확인
- Compartment 권한 확인
- 리전 코드가 올바른지 확인

#### 4. "Docker build failed"
- Docker 및 Docker Compose 설치 확인
- 네트워크 연결 상태 확인
- 포트 8080이 사용 중인지 확인

### 로그 분석
```bash
# 상세 로그로 디버깅
docker-compose run --rm notivm python src/main.py --mode single --log-level DEBUG

# 특정 오류 검색
grep -i "error" logs/notivm.log

# 최근 활동 확인
tail -n 100 logs/notivm.log
```

### 설정 테스트
```bash
# 봇 연결 테스트
docker-compose run --rm notivm python -c "
from src.telegram_bot import TelegramBot
import yaml
with open('/app/config/config.yaml') as f:
    config = yaml.safe_load(f)
bot = TelegramBot(config)
print('Bot test:', bot.test_connection())
"
```

## 📊 모니터링

### 헬스 체크
```bash
# 컨테이너 상태 확인
curl http://localhost:8080/health

# 응답 예시
{
  "status": "healthy",
  "service": "notivm",
  "timestamp": "2025-07-15 12:34:56"
}
```

### 시스템 리소스
```bash
# Docker 컨테이너 리소스 사용량
docker stats notivm

# 디스크 사용량
du -sh logs/
```

## 🔒 보안 고려사항

1. **API 키 보안**: .pem 파일은 600 권한으로 설정
2. **환경변수**: .env 파일을 Git에 커밋하지 않음
3. **네트워크**: 필요한 포트만 노출
4. **로깅**: 민감한 정보는 로그에 기록하지 않음

## 📈 성능 최적화

1. **재시도 간격**: 너무 짧으면 API 제한, 너무 길면 기회 손실
2. **로그 순환**: 오래된 로그 파일 자동 정리
3. **메모리 사용량**: 장시간 실행 시 메모리 모니터링

## 💡 추가 팁

### 리전별 권장 사항
- **개발용**: US Phoenix (빠른 생성)
- **운영용**: Japan Tokyo (최적 성능)
- **학습용**: Singapore (중간 타협점)

### 성공률 높이는 방법
1. 인기 없는 Availability Domain 선택
2. 새벽 시간대 활용 (한국 시간 기준)
3. 여러 리전에서 동시 시도하지 않기

## 🤝 기여 및 지원

문제 발생 시:
1. 로그 파일 확인
2. 설정 검증
3. 네트워크 연결 상태 확인
4. Oracle Cloud 서비스 상태 확인

## 📄 라이센스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

---

**⚠️ 주의사항**: 
- Oracle Cloud 무료 계정의 제한사항을 확인하세요
- API 호출 제한을 준수하세요
- 생성된 VM의 요금을 정기적으로 확인하세요
- 리전 선택은 신중하게 하세요 (변경 불가)