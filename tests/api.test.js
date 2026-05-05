const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  
  describe('GET /health', () => {
    it('应该返回健康状态', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/contributions/:username', () => {
    it('应该返回用户贡献数据', async () => {
      const res = await request(app).get('/api/contributions/octocat');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('userProfile');
      expect(res.body.data).toHaveProperty('totalContributions');
      expect(res.body.data).toHaveProperty('heatmapData');
    });

    it('应该拒绝无效用户名', async () => {
      const res = await request(app).get('/api/contributions/invalid<>user');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('应该处理不存在的用户', async () => {
      const res = await request(app).get('/api/contributions/nonexistentuser123456');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/heatmap/:username', () => {
    it('应该返回 SVG 热力图', async () => {
      const res = await request(app).get('/api/heatmap/octocat');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/svg/);
      expect(res.text).toContain('<svg');
    });

    it('应该支持颜色主题参数', async () => {
      const res = await request(app).get('/api/heatmap/octocat?colorScheme=blue');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/svg/);
    });

    it('应该拒绝无效的颜色主题', async () => {
      const res = await request(app).get('/api/heatmap/octocat?colorScheme=invalid');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/languages/:username', () => {
    it('应该返回语言分布图 SVG', async () => {
      const res = await request(app).get('/api/languages/octocat');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/svg/);
      expect(res.text).toContain('<svg');
    });
  });

  describe('GET /api/share-card/:username', () => {
    it('应该返回分享卡片 SVG', async () => {
      const res = await request(app).get('/api/share-card/octocat');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/svg/);
      expect(res.text).toContain('<svg');
    });
  });

  describe('速率限制', () => {
    it('应该限制频繁请求', async () => {
      // 发送多个请求测试限流
      const promises = [];
      for (let i = 0; i < 35; i++) {
        promises.push(request(app).get('/api/heatmap/octocat'));
      }
      
      const results = await Promise.all(promises);
      const blocked = results.filter(r => r.statusCode === 429);
      
      // 应该有部分请求被拦截
      expect(blocked.length).toBeGreaterThan(0);
    });
  });
});
