#!/usr/bin/env node

/**
 * notivm 성능 테스트 스크립트
 */

const https = require('https');
const { performance } = require('perf_hooks');

const SITE_URL = 'https://notivm.vercel.app';
const TEST_ENDPOINTS = [
  '/',
  '/api/mcp'
];

async function measurePageLoad(url) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const end = performance.now();
        const loadTime = end - start;
        
        resolve({
          url,
          statusCode: res.statusCode,
          loadTime: Math.round(loadTime),
          responseSize: data.length,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runPerformanceTest() {
  console.log('🚀 notivm 성능 테스트 시작\n');
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    const url = SITE_URL + endpoint;
    console.log(`📊 테스트 중: ${url}`);
    
    try {
      // 3번 테스트하여 평균 계산
      const measurements = [];
      for (let i = 0; i < 3; i++) {
        const result = await measurePageLoad(url);
        measurements.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      }
      
      const avgLoadTime = Math.round(measurements.reduce((sum, m) => sum + m.loadTime, 0) / 3);
      const minLoadTime = Math.min(...measurements.map(m => m.loadTime));
      const maxLoadTime = Math.max(...measurements.map(m => m.loadTime));
      
      const testResult = {
        endpoint,
        statusCode: measurements[0].statusCode,
        avgLoadTime,
        minLoadTime,
        maxLoadTime,
        responseSize: measurements[0].responseSize,
        contentType: measurements[0].headers['content-type']
      };
      
      results.push(testResult);
      
      console.log(`  ✅ 상태: ${testResult.statusCode}`);
      console.log(`  ⏱️  평균 로딩: ${avgLoadTime}ms`);
      console.log(`  📦 응답 크기: ${(testResult.responseSize / 1024).toFixed(2)}KB`);
      console.log('');
      
    } catch (error) {
      console.log(`  ❌ 오류: ${error.message}\n`);
      results.push({
        endpoint,
        error: error.message
      });
    }
  }
  
  // 결과 요약
  console.log('📈 성능 테스트 결과 요약');
  console.log('='.repeat(50));
  
  const successfulTests = results.filter(r => !r.error);
  const failedTests = results.filter(r => r.error);
  
  if (successfulTests.length > 0) {
    console.log(`✅ 성공한 테스트: ${successfulTests.length}/${results.length}`);
    
    const totalAvgTime = Math.round(
      successfulTests.reduce((sum, r) => sum + r.avgLoadTime, 0) / successfulTests.length
    );
    
    console.log(`⚡ 전체 평균 로딩 시간: ${totalAvgTime}ms`);
    
    // 성능 등급 평가
    let grade = 'C';
    if (totalAvgTime < 200) grade = 'A';
    else if (totalAvgTime < 500) grade = 'B';
    else if (totalAvgTime < 1000) grade = 'C';
    else grade = 'D';
    
    console.log(`🏆 성능 등급: ${grade}`);
    
    // 상세 결과
    console.log('\n📋 상세 결과:');
    successfulTests.forEach(result => {
      console.log(`  ${result.endpoint}: ${result.avgLoadTime}ms (${result.statusCode})`);
    });
  }
  
  if (failedTests.length > 0) {
    console.log(`\n❌ 실패한 테스트: ${failedTests.length}`);
    failedTests.forEach(result => {
      console.log(`  ${result.endpoint}: ${result.error}`);
    });
  }
  
  // 권장사항
  console.log('\n💡 성능 개선 권장사항:');
  if (totalAvgTime > 500) {
    console.log('  - 이미지 최적화 고려');
    console.log('  - CDN 사용 검토');
    console.log('  - 코드 스플리팅 적용');
  }
  if (successfulTests.some(r => r.responseSize > 1024 * 100)) {
    console.log('  - 응답 크기 압축 고려');
  }
  console.log('  - Supabase 인증 설정 확인 필요');
  
  return results;
}

// 테스트 실행
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest, measurePageLoad };