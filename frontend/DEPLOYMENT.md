# Vercel 배포 가이드

## 📋 단계별 환경변수 설정 방법

### 1단계: Vercel 대시보드 접속
1. [vercel.com](https://vercel.com)에 로그인
2. 프로젝트 목록에서 `notivm-frontend` (또는 해당 프로젝트명) 클릭

### 2단계: Settings 메뉴 접속
1. 프로젝트 페이지 상단 탭에서 **"Settings"** 클릭
2. 왼쪽 사이드바에서 **"Environment Variables"** 클릭

### 3단계: 환경변수 추가
각 환경변수를 다음과 같이 추가하세요:

#### 첫 번째 환경변수
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `YOUR_SUPABASE_PROJECT_URL_HERE`
- **Environment**: **Production, Preview, Development** 모두 체크
- **"Add"** 버튼 클릭

#### 두 번째 환경변수
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `YOUR_SUPABASE_ANON_KEY_HERE`
- **Environment**: **Production, Preview, Development** 모두 체크
- **"Add"** 버튼 클릭

### 4단계: 재배포 실행
1. 상단 탭에서 **"Deployments"** 클릭
2. 가장 최근 배포의 오른쪽 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. **"Use existing Build Cache"** 체크 해제 (권장)
5. **"Redeploy"** 버튼 클릭

## ⚠️ 중요 사항
- 환경변수 추가 후 반드시 재배포해야 적용됩니다
- Production, Preview, Development 모든 환경에 동일하게 설정하세요
- Build Cache를 사용하지 않고 재배포하는 것을 권장합니다

## 배포 명령어

```bash
# 로컬 테스트
npm run build

# Vercel 배포
vercel --prod
```

## 문제 해결

배포 실패 시 확인사항:
- 모든 환경변수가 올바르게 설정되었는지 확인
- Supabase URL과 Key가 정확한지 확인
- Build 로그에서 구체적인 오류 메시지 확인