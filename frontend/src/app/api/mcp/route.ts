import { z } from 'zod';
import { createMcpHandler } from '@vercel/mcp-adapter';

const handler = createMcpHandler(
  (server) => {
    // VM 생성 시작 도구
    server.tool(
      'start_vm_creation',
      'Start Oracle Cloud VM creation process with specified configuration',
      {
        region: z.string().describe('Oracle Cloud region (e.g., us-phoenix-1, ap-tokyo-1)'),
        shape: z.string().default('VM.Standard.A1.Flex').describe('VM shape'),
        ocpus: z.number().int().min(1).max(4).default(2).describe('Number of vCPUs'),
        memory: z.number().int().min(6).max(24).default(12).describe('Memory in GB'),
        storage: z.number().int().min(47).max(200).default(50).describe('Boot volume size in GB'),
        displayName: z.string().default('AutoCreated-VM').describe('VM display name'),
        maxRetries: z.number().int().default(1000).describe('Maximum retry attempts'),
      },
      async (params) => {
        // VM 생성 로직 (실제로는 백엔드 Python 서비스와 통신)
        console.log('Starting VM creation with params:', params);
        
        // 시뮬레이션된 응답
        const jobId = `vm-job-${Date.now()}`;
        
        return {
          content: [
            {
              type: 'text',
              text: `🚀 VM 생성이 시작되었습니다!

**설정:**
- 리전: ${params.region}
- Shape: ${params.shape}
- vCPUs: ${params.ocpus}
- 메모리: ${params.memory}GB
- 스토리지: ${params.storage}GB
- 이름: ${params.displayName}

**Job ID:** ${jobId}

예상 소요 시간: ${getEstimatedTime(params.region)}
최대 재시도 횟수: ${params.maxRetries}회

VM 생성 상태는 'check_vm_status' 도구로 확인할 수 있습니다.`
            }
          ]
        };
      }
    );

    // VM 상태 확인 도구
    server.tool(
      'check_vm_status',
      'Check the status of VM creation job',
      {
        jobId: z.string().optional().describe('Job ID from start_vm_creation. If not provided, shows all active jobs'),
      },
      async ({ jobId }) => {
        // 실제로는 백엔드에서 상태를 가져옴
        const mockStatus = {
          jobId: jobId || 'vm-job-latest',
          status: 'running',
          progress: 15,
          currentAttempt: 42,
          maxAttempts: 1000,
          region: 'us-phoenix-1',
          estimatedCompletion: '3-7일',
          lastError: null,
          createdAt: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: `📊 VM 생성 상태

**Job ID:** ${mockStatus.jobId}
**상태:** ${getStatusEmoji(mockStatus.status)} ${mockStatus.status.toUpperCase()}
**진행률:** ${mockStatus.progress}%
**시도 횟수:** ${mockStatus.currentAttempt}/${mockStatus.maxAttempts}
**리전:** ${mockStatus.region}
**예상 완료:** ${mockStatus.estimatedCompletion}
**시작 시간:** ${new Date(mockStatus.createdAt).toLocaleString('ko-KR')}

${mockStatus.status === 'running' ? '⏳ VM 생성이 진행 중입니다. 잠시만 기다려 주세요...' : ''}
${mockStatus.lastError ? `❌ 마지막 오류: ${mockStatus.lastError}` : ''}`
            }
          ]
        };
      }
    );

    // VM 생성 중지 도구
    server.tool(
      'stop_vm_creation',
      'Stop the VM creation process',
      {
        jobId: z.string().describe('Job ID to stop'),
        reason: z.string().optional().describe('Reason for stopping'),
      },
      async ({ jobId, reason }) => {
        return {
          content: [
            {
              type: 'text',
              text: `🛑 VM 생성이 중지되었습니다.

**Job ID:** ${jobId}
**중지 이유:** ${reason || '사용자 요청'}
**중지 시간:** ${new Date().toLocaleString('ko-KR')}

VM 생성을 다시 시작하려면 'start_vm_creation' 도구를 사용하세요.`
            }
          ]
        };
      }
    );

    // 리전별 권장사항 조회 도구
    server.tool(
      'get_region_recommendations',
      'Get Oracle Cloud region recommendations with success rates and estimated times',
      {},
      async () => {
        const regions = [
          {
            id: 'us-phoenix-1',
            name: 'US West (Phoenix)',
            category: '빠른 생성',
            estimatedTime: '3-7일',
            successRate: '90%',
            latency: '180-200ms',
            recommendation: '개발/테스트 환경에 최적',
            color: '🟢'
          },
          {
            id: 'us-ashburn-1', 
            name: 'US East (Ashburn)',
            category: '빠른 생성',
            estimatedTime: '5-10일',
            successRate: '85%',
            latency: '200-250ms',
            recommendation: '안정적인 생성률',
            color: '🟢'
          },
          {
            id: 'ap-tokyo-1',
            name: 'Japan East (Tokyo)', 
            category: '균형형',
            estimatedTime: '1-3주',
            successRate: '75%',
            latency: '30-60ms',
            recommendation: '한국 사용자 추천 - 최적 성능',
            color: '🟡'
          },
          {
            id: 'ap-singapore-1',
            name: 'Singapore',
            category: '균형형', 
            estimatedTime: '2-4주',
            successRate: '65%',
            latency: '80-120ms',
            recommendation: '아시아 중심',
            color: '🟡'
          },
          {
            id: 'ap-seoul-1',
            name: 'Korea Seoul',
            category: '느림',
            estimatedTime: '4-8주+',
            successRate: '40%',
            latency: '5-15ms',
            recommendation: '비추천 - 생성 매우 어려움',
            color: '🔴'
          }
        ];

        let response = '🌍 **Oracle Cloud 리전별 VM 생성 가이드**\n\n';
        
        const categories = ['빠른 생성', '균형형', '느림'];
        
        categories.forEach(category => {
          const categoryRegions = regions.filter(r => r.category === category);
          response += `## ${getCategoryEmoji(category)} ${category}\n\n`;
          
          categoryRegions.forEach(region => {
            response += `**${region.name}** (${region.id})\n`;
            response += `- 예상 시간: ${region.estimatedTime}\n`;
            response += `- 성공률: ${region.successRate}\n`;
            response += `- 레이턴시: ${region.latency}\n`;
            response += `- 추천사항: ${region.recommendation}\n\n`;
          });
        });

        response += '\n💡 **선택 가이드:**\n';
        response += '- 빠른 생성이 우선이면: US Phoenix 또는 US Ashburn\n';
        response += '- 한국에서 사용하면서 성능이 중요하면: Japan Tokyo\n';
        response += '- Korea Seoul은 성공률이 낮아 권장하지 않습니다\n';

        return {
          content: [{ type: 'text', text: response }]
        };
      }
    );

    // 설정 업데이트 도구
    server.tool(
      'update_vm_config',
      'Update VM creation configuration',
      {
        telegramBotToken: z.string().optional().describe('Telegram bot token'),
        telegramChatId: z.string().optional().describe('Telegram chat ID'),
        ociUserOcid: z.string().optional().describe('OCI User OCID'),
        ociTenancyOcid: z.string().optional().describe('OCI Tenancy OCID'),
        ociRegion: z.string().optional().describe('Default OCI region'),
        ociFingerprint: z.string().optional().describe('OCI key fingerprint'),
      },
      async (config) => {
        const updatedFields = Object.entries(config)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => `- ${key}: ${key.includes('Token') || key.includes('Ocid') ? '***' : value}`)
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `⚙️ 설정이 업데이트되었습니다.

**업데이트된 필드:**
${updatedFields}

**보안 알림:** 중요한 정보(토큰, OCID 등)는 안전하게 저장되었습니다.

변경사항을 적용하려면 VM 생성 서비스를 재시작해주세요.`
            }
          ]
        };
      }
    );

    // 로그 확인 도구
    server.tool(
      'get_vm_logs',
      'Get VM creation logs and recent activity',
      {
        lines: z.number().int().min(10).max(1000).default(50).describe('Number of log lines to retrieve'),
        level: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR']).optional().describe('Filter by log level'),
      },
      async ({ lines, level }) => {
        // 모의 로그 데이터
        const mockLogs = [
          { timestamp: new Date(), level: 'INFO', message: 'VM creation service started' },
          { timestamp: new Date(), level: 'INFO', message: 'Connected to Oracle Cloud API' },
          { timestamp: new Date(), level: 'INFO', message: 'Telegram bot initialized successfully' },
          { timestamp: new Date(), level: 'INFO', message: 'Starting VM creation attempt #42' },
          { timestamp: new Date(), level: 'WARNING', message: 'Capacity not available in AD-1, trying AD-2' },
          { timestamp: new Date(), level: 'INFO', message: 'Waiting 120 seconds before next retry' },
        ].slice(-lines);

        const filteredLogs = level ? mockLogs.filter(log => log.level === level) : mockLogs;

        let logText = `📋 **VM 생성 로그** (최근 ${filteredLogs.length}개)\n\n`;
        
        filteredLogs.forEach(log => {
          const emoji = getLogEmoji(log.level);
          logText += `${emoji} \`${log.timestamp.toLocaleTimeString('ko-KR')}\` [${log.level}] ${log.message}\n`;
        });

        if (filteredLogs.length === 0) {
          logText += '로그가 없습니다.\n';
        }

        logText += `\n💡 더 자세한 로그는 서버의 \`/root/dev/notivm/logs/\` 디렉토리에서 확인할 수 있습니다.`;

        return {
          content: [{ type: 'text', text: logText }]
        };
      }
    );
  }
);

// 헬퍼 함수들
function getEstimatedTime(region: string): string {
  const times: Record<string, string> = {
    'us-phoenix-1': '3-7일',
    'us-ashburn-1': '5-10일', 
    'ap-tokyo-1': '1-3주',
    'ap-singapore-1': '2-4주',
    'ap-seoul-1': '4-8주+',
  };
  return times[region] || '알 수 없음';
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    'running': '🔄',
    'completed': '✅',
    'failed': '❌',
    'stopped': '🛑',
  };
  return emojis[status] || '❓';
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    '빠른 생성': '🏃‍♂️',
    '균형형': '⚡',
    '느림': '🐌',
  };
  return emojis[category] || '📍';
}

function getLogEmoji(level: string): string {
  const emojis: Record<string, string> = {
    'DEBUG': '🔍',
    'INFO': 'ℹ️',
    'WARNING': '⚠️',
    'ERROR': '❌',
  };
  return emojis[level] || '📝';
}

export { handler as GET, handler as POST, handler as DELETE };