const helmet = require('helmet');

/**
 * Helmet 安全中间件配置
 * 设置各种 HTTP 安全头
 */

const securityHeaders = helmet({
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // 允许内联脚本（前端需要）
      styleSrc: ["'self'", "'unsafe-inline'"], // 允许内联样式
      imgSrc: ["'self'", "data:", "https:", "http:"], // 允许图片
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"], // 禁止 embed/object
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"], // 禁止 iframe
    },
  },
  
  // 跨域嵌入策略
  crossOriginEmbedderPolicy: false, // 允许加载跨域资源
  
  // 其他默认安全头
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

module.exports = securityHeaders;
