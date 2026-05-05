const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🔒 开始安全性测试\n');

async function testSecurity() {
  // 测试 1: 健康检查
  console.log('1️⃣  测试健康检查端点...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('   ✓ 状态:', response.data.status);
    console.log('   ✓ 版本:', response.data.version);
    console.log('   ✓ 运行时间:', response.data.uptime.toFixed(2), '秒\n');
  } catch (error) {
    console.error('   ✗ 失败:', error.message, '\n');
  }

  // 测试 2: 无效用户名（应该被拒绝）
  console.log('2️⃣  测试无效用户名验证...');
  const invalidUsernames = [
    '', // 空字符串
    'a'.repeat(40), // 超长
    '<script>alert("xss")</script>', // XSS 攻击
    'user<script>', // 注入尝试
    '-invalid', // 以连字符开头
    'invalid-', // 以连字符结尾
  ];

  for (const username of invalidUsernames) {
    try {
      await axios.get(`${BASE_URL}/api/heatmap/${username}`);
      console.log(`   ✗ 未拦截: "${username.substring(0, 20)}"`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log(`   ✓ 已拦截: "${username.substring(0, 20)}" - ${error.response.data.error}`);
      } else {
        console.log(`   ? 其他错误: ${error.response?.status}`);
      }
    }
  }
  console.log();

  // 测试 3: 无效颜色主题（应该被拒绝）
  console.log('3️⃣  测试无效颜色主题验证...');
  try {
    await axios.get(`${BASE_URL}/api/heatmap/octocat?colorScheme=invalid`);
    console.log('   ✗ 未拦截无效主题');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('   ✓ 已拦截无效主题:', error.response.data.error);
    }
  }
  console.log();

  // 测试 4: 速率限制（发送大量请求）
  console.log('4️⃣  测试速率限制...');
  console.log('   发送 35 个快速请求（限制为 30）...');
  
  let blockedCount = 0;
  const requests = [];
  
  for (let i = 0; i < 35; i++) {
    requests.push(
      axios.get(`${BASE_URL}/api/heatmap/octocat`)
        .catch(error => {
          if (error.response && error.response.status === 429) {
            blockedCount++;
          }
        })
    );
  }
  
  await Promise.all(requests);
  console.log(`   ✓ 被拦截的请求数: ${blockedCount}/35`);
  console.log(`   ✓ 成功率: ${((35 - blockedCount) / 35 * 100).toFixed(1)}%\n`);

  // 测试 5: 检查安全头
  console.log('5️⃣  检查 HTTP 安全头...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const headers = response.headers;
    
    const securityHeaders = [
      'x-dns-prefetch-control',
      'x-frame-options',
      'strict-transport-security',
      'x-download-options',
      'x-content-type-options',
      'x-permitted-cross-domain-policies'
    ];
    
    let foundCount = 0;
    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`   ✓ ${header}: ${headers[header]}`);
        foundCount++;
      }
    });
    
    console.log(`   ✓ 找到 ${foundCount}/${securityHeaders.length} 个安全头\n`);
  } catch (error) {
    console.error('   ✗ 失败:', error.message, '\n');
  }

  // 测试 6: 正常请求（应该成功）
  console.log('6️⃣  测试正常请求...');
  try {
    const response = await axios.get(`${BASE_URL}/api/contributions/octocat`);
    if (response.data.success) {
      console.log('   ✓ 成功获取数据');
      console.log('   ✓ 总贡献数:', response.data.data.totalContributions);
      console.log('   ✓ 语言数量:', response.data.data.languageStats.length);
    }
  } catch (error) {
    console.error('   ✗ 失败:', error.message);
  }
  console.log();

  console.log('='.repeat(50));
  console.log('✅ 安全性测试完成！');
  console.log('='.repeat(50));
}

testSecurity().catch(console.error);
