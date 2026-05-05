const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🗄️  开始缓存功能测试\n');

async function testCache() {
  const username = 'octocat';
  
  // 测试 1: 首次请求（应该是 Cache MISS）
  console.log('1️⃣  首次请求（应该 Cache MISS）...');
  const startTime1 = Date.now();
  await axios.get(`${BASE_URL}/api/contributions/${username}`);
  const duration1 = Date.now() - startTime1;
  console.log(`   ⏱️  耗时: ${duration1}ms`);
  console.log('   📝 日志应显示: [Cache MISS]\n');

  // 等待一下让日志输出
  await new Promise(resolve => setTimeout(resolve, 500));

  // 测试 2: 第二次请求（应该是 Cache HIT）
  console.log('2️⃣  第二次请求（应该 Cache HIT）...');
  const startTime2 = Date.now();
  await axios.get(`${BASE_URL}/api/contributions/${username}`);
  const duration2 = Date.now() - startTime2;
  console.log(`   ⏱️  耗时: ${duration2}ms`);
  console.log(`   🚀 性能提升: ${((duration1 - duration2) / duration1 * 100).toFixed(1)}%`);
  console.log('   📝 日志应显示: [Cache HIT]\n');

  await new Promise(resolve => setTimeout(resolve, 500));

  // 测试 3: SVG 热力图缓存
  console.log('3️⃣  测试热力图 SVG 缓存...');
  console.log('   首次生成...');
  const startSvg1 = Date.now();
  await axios.get(`${BASE_URL}/api/heatmap/${username}`);
  const svgDuration1 = Date.now() - startSvg1;
  console.log(`   ⏱️  耗时: ${svgDuration1}ms`);

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('   第二次获取（应从缓存）...');
  const startSvg2 = Date.now();
  await axios.get(`${BASE_URL}/api/heatmap/${username}`);
  const svgDuration2 = Date.now() - startSvg2;
  console.log(`   ⏱️  耗时: ${svgDuration2}ms`);
  console.log(`   🚀 性能提升: ${((svgDuration1 - svgDuration2) / svgDuration1 * 100).toFixed(1)}%\n`);

  await new Promise(resolve => setTimeout(resolve, 500));

  // 测试 4: 不同颜色主题应该有不同的缓存
  console.log('4️⃣  测试不同颜色主题的缓存隔离...');
  await axios.get(`${BASE_URL}/api/heatmap/${username}?colorScheme=blue`);
  console.log('   ✓ 蓝色主题已缓存');
  await axios.get(`${BASE_URL}/api/heatmap/${username}?colorScheme=purple`);
  console.log('   ✓ 紫色主题已缓存');
  console.log('   📝 每个主题应该有独立的缓存键\n');

  await new Promise(resolve => setTimeout(resolve, 500));

  // 测试 5: 健康检查端点查看缓存状态
  console.log('5️⃣  检查缓存服务状态...');
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('   ✓ 服务器运行正常');
    console.log('   ✓ 版本:', healthResponse.data.version);
  } catch (error) {
    console.error('   ✗ 健康检查失败:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ 缓存测试完成！');
  console.log('='.repeat(50));
  console.log('\n💡 提示: 查看服务器控制台日志确认缓存命中情况');
}

testCache().catch(console.error);
