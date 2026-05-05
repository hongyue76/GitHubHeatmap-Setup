const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const GitHubService = require('./services/githubService');
const DataProcessor = require('./services/dataProcessor');
const HeatmapRenderer = require('./services/heatmapRenderer');
const cache = require('./services/cacheService');
const db = require('./services/databaseService');

// 导入日志和错误监控
const { logger, httpLogger } = require('./config/logger');
const errorMonitor = require('./services/errorMonitor');

// 导入国际化配置
const i18n = require('./config/i18n');
const i18nextMiddleware = require('i18next-http-middleware');

// 导入路由
const authRouter = require('./routes/auth');
const exportRouter = require('./routes/export');

// 导入安全中间件
const securityHeaders = require('./middleware/security');
const { apiLimiter, strictLimiter } = require('./middleware/rateLimiter');
const { validateUsername, validateColorScheme, handleValidationErrors } = require('./middleware/validation');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 安全中间件（必须最先加载）
// ============================================

// 1. Helmet 安全头
app.use(securityHeaders);

// 2. CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. HTTP 请求日志
app.use(httpLogger);

// 4. Body parser（限制大小防止 DoS）
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 初始化服务
const githubService = new GitHubService(process.env.GITHUB_TOKEN);
const dataProcessor = new DataProcessor();
const heatmapRenderer = new HeatmapRenderer();

// ============================================
// API 路由（带验证和限流）
// ============================================

/**
 * API: 获取用户贡献数据
 */
app.get('/api/contributions/:username', 
  apiLimiter,
  validateUsername,
  handleValidationErrors,
  async (req, res) => {
  try {
    const { username } = req.params;
    
    logger.info(`Fetching contributions for: ${username}`);
    
    // 获取用户信息
    const userProfile = await githubService.getUserProfile(username);
    
    // 获取贡献数据
    const contributionData = await githubService.getContributions(username);
    
    // 获取仓库列表
    const repos = await githubService.getUserRepos(username);
    
    // 处理数据
    const processedData = dataProcessor.processContributions(
      contributionData.contributions,
      repos
    );
    
    // 生成热力图数据
    const heatmapData = dataProcessor.generateHeatmapData(contributionData.contributions);

    res.json({
      success: true,
      data: {
        userProfile,
        totalContributions: contributionData.totalContributions,
        heatmapData,
        languageStats: processedData.languageStats,
        projectStats: processedData.projectStats
      }
    });
  } catch (error) {
    console.error('[API Error] Fetching contributions:', error.message);
    
    // 根据错误类型返回不同的状态码
    if (error.message.includes('用户不存在')) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    if (error.message.includes('API rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'GitHub API 速率限制，请稍后再试'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * API: 生成热力图图片
 */
app.get('/api/heatmap/:username', 
  strictLimiter,
  validateUsername,
  validateColorScheme,
  handleValidationErrors,
  async (req, res) => {
  try {
    const { username } = req.params;
    const { colorScheme = 'default' } = req.query;
    
    logger.info(`Generating heatmap for: ${username} (theme: ${colorScheme})`);
    
    // 尝试从缓存获取 SVG
    const cacheKey = `svg:heatmap:${username}:${colorScheme}`;
    const cachedSvg = await cache.get(cacheKey);
    
    if (cachedSvg) {
      logger.debug(`[Cache HIT] Heatmap SVG: ${username}`);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(cachedSvg);
    }
    
    logger.info(`[Cache MISS] Rendering heatmap SVG: ${username}`);
    
    // 获取贡献数据
    const contributionData = await githubService.getContributions(username);
    const heatmapData = dataProcessor.generateHeatmapData(contributionData.contributions);
    
    // 渲染热力图
    const svg = heatmapRenderer.renderHeatmap(
      heatmapData,
      colorScheme,
      {
        width: 800,
        height: 200,
        showLabels: true,
        title: `${username}'s Contribution Activity`
      }
    );
    
    // 写入缓存（30 分钟）
    await cache.set(cacheKey, svg, 1800);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存 1 小时
    res.send(svg);
  } catch (error) {
    console.error('[API Error] Generating heatmap:', error.message);
    
    if (error.message.includes('用户不存在')) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * API: 生成语言分布图
 */
app.get('/api/languages/:username', 
  strictLimiter,
  validateUsername,
  handleValidationErrors,
  async (req, res) => {
  try {
    const { username } = req.params;
    
    logger.info(`Generating language chart for: ${username}`);
    
    // 尝试从缓存获取 SVG
    const cacheKey = `svg:language:${username}`;
    const cachedSvg = await cache.get(cacheKey);
    
    if (cachedSvg) {
      logger.debug(`[Cache HIT] Language SVG: ${username}`);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(cachedSvg);
    }
    
    logger.info(`[Cache MISS] Rendering language SVG: ${username}`);
    
    // 获取仓库列表
    const repos = await githubService.getUserRepos(username);
    
    // 计算语言统计
    const languageStats = dataProcessor.calculateLanguageStats(repos);
    
    // 渲染语言图
    const svg = heatmapRenderer.renderLanguageChart(languageStats, 400, 300);
    
    // 写入缓存（30 分钟）
    await cache.set(cacheKey, svg, 1800);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存 1 小时
    res.send(svg);
  } catch (error) {
    console.error('[API Error] Generating language chart:', error.message);
    
    if (error.message.includes('用户不存在')) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * API: 生成分享卡片
 */
app.get('/api/share-card/:username', 
  strictLimiter,
  validateUsername,
  validateColorScheme,
  handleValidationErrors,
  async (req, res) => {
  try {
    const { username } = req.params;
    const { colorScheme = 'default' } = req.query;
    
    logger.info(`Generating share card for: ${username} (theme: ${colorScheme})`);
    
    // 尝试从缓存获取 SVG
    const cacheKey = `svg:share-card:${username}:${colorScheme}`;
    const cachedSvg = await cache.get(cacheKey);
    
    if (cachedSvg) {
      logger.debug(`[Cache HIT] Share card SVG: ${username}`);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(cachedSvg);
    }
    
    logger.info(`[Cache MISS] Rendering share card SVG: ${username}`);
    
    // 获取用户信息
    const userProfile = await githubService.getUserProfile(username);
    
    // 获取贡献数据
    const contributionData = await githubService.getContributions(username);
    
    // 获取仓库列表
    const repos = await githubService.getUserRepos(username);
    
    // 计算语言统计
    const languageStats = dataProcessor.calculateLanguageStats(repos);
    
    // 渲染分享卡片
    const svg = heatmapRenderer.renderShareCard(
      username,
      userProfile,
      contributionData.totalContributions,
      languageStats,
      colorScheme
    );
    
    // 写入缓存（30 分钟）
    await cache.set(cacheKey, svg, 1800);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存 1 小时
    res.send(svg);
  } catch (error) {
    console.error('[API Error] Generating share card:', error.message);
    
    if (error.message.includes('用户不存在')) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 主页路由
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  const errorStats = errorMonitor.getStats();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version,
    monitoring: {
      errors: {
        total: errorStats.totalErrors,
        lastHour: errorStats.errorsLastHour,
        last24Hours: errorStats.errorsLast24Hours,
      }
    }
  });
});

/**
 * 错误统计端点（开发环境）
 */
app.get('/api/errors', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  const stats = errorMonitor.getStats();
  const recent = errorMonitor.getRecentErrors(20);
  
  res.json({
    success: true,
    stats,
    recentErrors: recent
  });
});

// ============================================
// 错误处理（必须最后加载）
// ============================================

// 404 处理
app.use(notFoundHandler);

// 全局错误处理（使用错误监控）
app.use(errorMonitor.expressErrorHandler());

// ============================================
// 启动服务器
// ============================================
app.listen(PORT, () => {
  logger.info(`GitHub Contribution Heatmap Generator running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Security features enabled: Helmet, Rate Limiting, Input Validation`);
  logger.info(`Logging system: Winston (files in logs/ directory)`);
  logger.info(`Error monitoring: Active`);
});

module.exports = app;
