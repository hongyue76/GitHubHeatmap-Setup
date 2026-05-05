const rateLimit = require('express-rate-limit');

/**
 * API 速率限制配置
 * 防止 API 滥用和 DDoS 攻击
 */

// 通用 API 限流：15 分钟内最多 100 次请求
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 次请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // 返回 RateLimit-* 头
  legacyHeaders: false,
});

// 严格的限流：用于敏感操作（如生成图片）
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 30, // 每个 IP 最多 30 次请求
  message: {
    success: false,
    error: '生成请求过于频繁，请稍后再试',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 宽松的限流：用于静态资源
const gentleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 200, // 每个 IP 最多 200 次请求
  message: {
    success: false,
    error: '请求过于频繁',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  strictLimiter,
  gentleLimiter
};
