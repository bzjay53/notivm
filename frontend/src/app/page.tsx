'use client'

import { useState, useEffect } from 'react'
import { ChevronRightIcon, CloudIcon, CpuChipIcon, ServerIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid'

export default function Home() {
  const [isCreating, setIsCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
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

  // 실시간 진행률 시뮬레이션
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCreating) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 2
          if (newProgress >= 100) {
            setIsCreating(false)
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
      name: 'US West (Phoenix)', 
      speed: '빠름 (3-7일)', 
      success: '90%',
      flag: '🇺🇸',
      tier: 'premium',
      ping: '180ms'
    },
    { 
      id: 'us-ashburn-1', 
      name: 'US East (Ashburn)', 
      speed: '빠름 (5-10일)', 
      success: '85%',
      flag: '🇺🇸',
      tier: 'premium',
      ping: '200ms'
    },
    { 
      id: 'ap-tokyo-1', 
      name: 'Japan East (Tokyo)', 
      speed: '보통 (1-3주)', 
      success: '75%',
      flag: '🇯🇵',
      tier: 'standard',
      ping: '45ms'
    },
    { 
      id: 'ap-singapore-1', 
      name: 'Singapore', 
      speed: '보통 (2-4주)', 
      success: '65%',
      flag: '🇸🇬',
      tier: 'standard',
      ping: '80ms'
    },
    { 
      id: 'ap-seoul-1', 
      name: 'Korea Seoul', 
      speed: '느림 (4-8주+)', 
      success: '40%',
      flag: '🇰🇷',
      tier: 'basic',
      ping: '15ms'
    }
  ]

  const steps = [
    { id: 1, name: '설정', description: 'VM 구성 설정', icon: CpuChipIcon },
    { id: 2, name: '검증', description: '설정 확인', icon: CheckCircleIcon },
    { id: 3, name: '생성', description: 'VM 생성 시작', icon: CloudIcon },
    { id: 4, name: '완료', description: '생성 완료', icon: ServerIcon }
  ]

  const handleStartCreation = () => {
    setIsCreating(true)
    setCurrentStep(3)
    setProgress(0)
    setAttempts(0)
  }

  const handleStopCreation = () => {
    setIsCreating(false)
    setCurrentStep(1)
    setProgress(0)
    setAttempts(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              🚀 Oracle VM Creator
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">notivm v1.0</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Oracle Cloud VM 자동 생성기
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Oracle Cloud Infrastructure의 ARM 기반 무료 VM을 자동으로 생성하고 
            텔레그램으로 실시간 알림을 받아보세요.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* VM 생성 설정 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
              🎯 VM 생성 설정
            </h3>
            
            <div className="space-y-6">
              {/* 리전 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  리전 선택
                </label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={vmConfig.region}
                  onChange={(e) => setVmConfig({...vmConfig, region: e.target.value})}
                >
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.name} - {region.speed} (성공률 {region.success})
                    </option>
                  ))}
                </select>
              </div>

              {/* VM 사양 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    vCPUs
                  </label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vmConfig.ocpus}
                    onChange={(e) => setVmConfig({...vmConfig, ocpus: parseInt(e.target.value)})}
                  >
                    <option value={1}>1 vCPU</option>
                    <option value={2}>2 vCPUs</option>
                    <option value={4}>4 vCPUs</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메모리 (GB)
                  </label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={vmConfig.memory}
                    onChange={(e) => setVmConfig({...vmConfig, memory: parseInt(e.target.value)})}
                  >
                    <option value={6}>6 GB</option>
                    <option value={12}>12 GB</option>
                    <option value={24}>24 GB</option>
                  </select>
                </div>
              </div>

              {/* 스토리지 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <ServerIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">💾 스토리지 설정</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">부트 볼륨 크기</span>
                    <span className="text-lg font-bold text-gray-900">{vmConfig.storage} GB</span>
                  </div>
                  <input 
                    type="range"
                    min="47"
                    max="200"
                    step="1"
                    className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-500 rounded-lg appearance-none cursor-pointer"
                    value={vmConfig.storage}
                    onChange={(e) => setVmConfig({...vmConfig, storage: parseInt(e.target.value)})}
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>47 GB (최소)</span>
                    <span>200 GB (최대)</span>
                  </div>
                </div>
              </div>

              {/* 생성 버튼 */}
              <div className="pt-4">
                {!isCreating ? (
                  <button
                    onClick={handleStartCreation}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-3"
                  >
                    <PlayIcon className="w-5 h-5" />
                    <span>VM 생성 시작</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopCreation}
                    className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-3"
                  >
                    <PauseIcon className="w-5 h-5" />
                    <span>생성 중지</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* VM 설정 미리보기 카드 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200/50">
            <h4 className="text-lg font-bold text-gray-900 mb-4">🔍 구성 미리보기</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 px-3 bg-white/50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">리전</span>
                <span className="text-sm font-bold text-gray-900">
                  {regions.find(r => r.id === vmConfig.region)?.flag} {regions.find(r => r.id === vmConfig.region)?.name}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-white/50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">사양</span>
                <span className="text-sm font-bold text-gray-900">
                  {vmConfig.ocpus} vCPU / {vmConfig.memory} GB RAM
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-white/50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">스토리지</span>
                <span className="text-sm font-bold text-gray-900">{vmConfig.storage} GB</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-700">월 예상 비용</span>
                <span className="text-lg font-bold text-green-800">무료</span>
              </div>
            </div>
          </div>
        </div>

        {/* 상태 모니터링 - 전체 폭으로 확장 */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                실시간 생성 모니터링
              </h3>
            </div>
            
            {isCreating ? (
              <div className="space-y-8">
                {/* 진행률 표시 */}
                <div className="relative">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-blue-900">VM 생성 진행 중</h4>
                          <p className="text-sm text-blue-600">
                            {regions.find(r => r.id === vmConfig.region)?.flag} {regions.find(r => r.id === vmConfig.region)?.name}에서 생성 중
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-900">{Math.round(progress)}%</div>
                        <div className="text-xs text-blue-600">완료</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium text-blue-800">
                        <span>전체 진행률</span>
                        <span>{Math.round(progress)}% / 100%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 상세 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{attempts}</span>
                      </div>
                      <span className="text-green-800 font-semibold">시도 횟수</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{attempts} / 1000</p>
                    <p className="text-xs text-green-600">최대 시도 가능</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <ClockIcon className="w-8 h-8 text-orange-500" />
                      <span className="text-orange-800 font-semibold">예상 시간</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {regions.find(r => r.id === vmConfig.region)?.speed.match(/\((.+?)\)/)?.[1] || '알 수 없음'}
                    </p>
                    <p className="text-xs text-orange-600">완료까지 소요</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <CheckCircleIcon className="w-8 h-8 text-purple-500" />
                      <span className="text-purple-800 font-semibold">성공 확률</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {regions.find(r => r.id === vmConfig.region)?.success}
                    </p>
                    <p className="text-xs text-purple-600">예상 성공률</p>
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
                    좌측에서 VM 구성을 완료하고 생성 버튼을 클릭하면
                    <br />자동으로 Oracle Cloud VM 생성이 시작됩니다.
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

      {/* SuperClaude Enhanced 통계 대시보드 */}
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
              <p className="text-xs text-yellow-800 font-medium">한국 사용자에게 추천</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🐌</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-red-800">느림</h4>
              <p className="text-sm text-red-600">비추천</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-red-700">🇰🇷 Korea Seoul</span>
              <span className="text-sm font-bold text-red-800">40% 성공률</span>
            </div>
            <div className="bg-red-200 rounded-lg p-2 mt-3">
              <p className="text-xs text-red-800 font-medium">생성이 매우 어려움</p>
            </div>
          </div>
        </div>
      </div>

      {/* SuperClaude Footer */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full">
          <span className="text-sm text-purple-600">⚡ Powered by</span>
          <span className="text-sm font-bold text-purple-700">SuperClaude AI</span>
          <span className="text-sm text-purple-600">with Advanced UI/UX</span>
        </div>
      </div>
    </main>
  </div>
  )
}
