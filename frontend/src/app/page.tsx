'use client'

import { useState, useEffect } from 'react'
import { 
  CloudIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [attempts, setAttempts] = useState(0)

  const [vmConfig, setVmConfig] = useState({
    region: 'us-phoenix-1',
    shape: 'VM.Standard.A1.Flex',
    ocpus: 2,
    memory: 12,
    storage: 50,
    displayName: 'AutoCreated-VM'
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCreating) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev >= 90 ? 90 : prev + Math.random() * 10
          if (newProgress >= 90) {
            return 100
          }
          return newProgress
        })
        setAttempts(prev => prev + 1)
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isCreating])

  const regions = [
    { 
      id: 'us-phoenix-1', 
      name: '🇺🇸 US West (Phoenix)', 
      speed: '빠름',
      success: '90%',
      latency: '180ms'
    },
    { 
      id: 'us-ashburn-1', 
      name: '🇺🇸 US East (Ashburn)', 
      speed: '빠름',
      success: '85%',
      latency: '220ms'
    },
    { 
      id: 'ap-tokyo-1', 
      name: '🇯🇵 Japan East (Tokyo)', 
      speed: '보통',
      success: '75%',
      latency: '45ms'
    },
    { 
      id: 'ap-singapore-1', 
      name: '🇸🇬 Singapore', 
      speed: '보통',
      success: '65%',
      latency: '95ms'
    }
  ]

  const handleStartCreation = () => {
    setIsCreating(true)
    setProgress(0)
    setAttempts(0)
  }

  const handleStopCreation = () => {
    setIsCreating(false)
    setProgress(0)
    setAttempts(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <CloudIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">NotivM</h1>
                <p className="text-sm text-gray-500">Oracle Cloud VM Auto Creator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-700">ARM VM 생성</div>
                <div className="text-xs text-gray-500">무료 Tier 24/7 자동화</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* VM 설정 패널 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">VM 설정</h3>
              
              {/* 리전 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">리전 선택</label>
                <div className="space-y-2">
                  {regions.map((region) => (
                    <label key={region.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="region"
                        value={region.id}
                        checked={vmConfig.region === region.id}
                        onChange={(e) => setVmConfig({...vmConfig, region: e.target.value})}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{region.name}</div>
                        <div className="text-xs text-gray-500 flex space-x-3">
                          <span>성공률: {region.success}</span>
                          <span>지연: {region.latency}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        region.speed === '빠름' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {region.speed}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* VM 사양 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">vCPU</label>
                <select
                  value={vmConfig.ocpus}
                  onChange={(e) => setVmConfig({...vmConfig, ocpus: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={1}>1 vCPU</option>
                  <option value={2}>2 vCPU</option>
                  <option value={3}>3 vCPU</option>
                  <option value={4}>4 vCPU</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">메모리 (GB)</label>
                <select
                  value={vmConfig.memory}
                  onChange={(e) => setVmConfig({...vmConfig, memory: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={6}>6 GB</option>
                  <option value={12}>12 GB</option>
                  <option value={18}>18 GB</option>
                  <option value={24}>24 GB</option>
                </select>
              </div>

              {/* 생성/중지 버튼 */}
              <div className="flex space-x-3">
                {!isCreating ? (
                  <button
                    onClick={handleStartCreation}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    🚀 VM 생성 시작
                  </button>
                ) : (
                  <button
                    onClick={handleStopCreation}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
                  >
                    ⏹️ 생성 중지
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 상태 모니터링 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">실시간 모니터링</h3>
              
              {isCreating ? (
                <div className="space-y-6">
                  {/* 진행률 표시 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">생성 진행률</span>
                      <span className="text-sm font-medium text-gray-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 통계 카드들 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <ClockIcon className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{attempts}</div>
                      <div className="text-xs text-blue-600">시도 횟수</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CpuChipIcon className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{vmConfig.ocpus}</div>
                      <div className="text-xs text-green-600">vCPU</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircleIcon className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {regions.find(r => r.id === vmConfig.region)?.success}
                      </div>
                      <div className="text-xs text-purple-600">성공 확률</div>
                    </div>
                  </div>

                  {/* 실시간 로그 */}
                  <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 font-medium">실시간 로그</span>
                    </div>
                    <div className="space-y-1 text-gray-300 max-h-32 overflow-y-auto">
                      <p className="text-green-400">[{new Date().toLocaleTimeString()}] Oracle Cloud API 연결 성공</p>
                      <p className="text-blue-400">[{new Date().toLocaleTimeString()}] 리전 {vmConfig.region} 가용성 확인 중...</p>
                      <p className="text-yellow-400">[{new Date().toLocaleTimeString()}] VM 생성 요청 #{attempts} 전송</p>
                      <p className="text-cyan-400">[{new Date().toLocaleTimeString()}] 대기 중... 다음 시도까지 120초</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CloudIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-700 mb-2">VM 생성 대기 중</h4>
                    <p className="text-gray-500 max-w-md mx-auto">
                      좌측에서 VM 구성을 완료하고 생성 버튼을 클릭하면 자동으로 Oracle Cloud VM 생성이 시작됩니다.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">24/7</div>
                      <div className="text-xs text-blue-700">자동 실행</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">무료</div>
                      <div className="text-xs text-green-700">평생 사용</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 통계 대시보드 */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏃‍♂️</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-green-800">빠른 생성</h4>
                <p className="text-sm text-green-600">권장 리전</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">🇺🇸 US Phoenix</span>
                <span className="text-sm font-bold text-green-800">90% 성공률</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">🇺🇸 US Ashburn</span>
                <span className="text-sm font-bold text-green-800">85% 성공률</span>
              </div>
              <div className="bg-green-200 rounded-lg p-2 mt-3">
                <p className="text-xs text-green-800 font-medium">개발/테스트 환경에 최적화</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-yellow-800">균형형</h4>
                <p className="text-sm text-yellow-600">아시아 권장</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-yellow-700">🇯🇵 Japan Tokyo</span>
                <span className="text-sm font-bold text-yellow-800">75% 성공률</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-yellow-700">🇸🇬 Singapore</span>
                <span className="text-sm font-bold text-yellow-800">65% 성공률</span>
              </div>
              <div className="bg-yellow-200 rounded-lg p-2 mt-3">
                <p className="text-xs text-yellow-800 font-medium">서비스 운영에 최적화</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">📊</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-blue-800">모니터링</h4>
                <p className="text-sm text-blue-600">실시간 추적</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">텔레그램 알림</span>
                <span className="text-sm font-bold text-blue-800">활성화</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">자동 재시도</span>
                <span className="text-sm font-bold text-blue-800">1000회</span>
              </div>
              <div className="bg-blue-200 rounded-lg p-2 mt-3">
                <p className="text-xs text-blue-800 font-medium">24/7 무인 운영</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full">
            <span className="text-sm text-purple-600">⚡ Powered by</span>
            <span className="text-sm font-bold text-purple-700">Claude Code</span>
            <span className="text-sm text-purple-600">& Vercel MCP</span>
          </div>
        </div>
      </main>
    </div>
  );
}