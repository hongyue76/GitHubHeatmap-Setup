const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 日志目录
const logDir = path.join(__dirname, '../logs');

// 确保日志目录存在
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 自定义日志格式
 */
const customFormat = winston.format.combine(
  // 添加时间戳
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  // 添加错误堆栈
  winston.format.errors({ stack: true }),
  // 格式化输出
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    // 如果有额外元数据，添加到日志
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

/**
 * 控制台输出格式（带颜色）
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

/**
 * 创建 Logger 实例
 */
const logger = winston.createLogger({
  // 最低日志级别
  level: process.env.LOG_LEVEL || 'info',
  
  // 默认格式
  format: customFormat,
  
  // 传输目标
  transports: [
    // 1. 错误日志文件（只记录 error 级别）
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',      // 单个文件最大 20MB
      maxFiles: '30d',     // 保留 30 天
      zippedArchive: true, // 压缩旧日志
    }),
    
    // 2. 综合日志文件（记录所有级别）
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    
    // 3. HTTP 请求日志
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '50m',
      maxFiles: '14d',     // HTTP 日志保留 14 天
      zippedArchive: true,
    }),
  ],
});

// 开发环境下也输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug',
  }));
} else {
  // 生产环境只输出 warn 及以上级别到控制台
  logger.add(new winston.transports.Console({
    format: customFormat,
    level: 'warn',
  }));
}

/**
 * 创建 HTTP 请求日志中间件
 */
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.http({
      message: `${req.method} ${req.originalUrl}`,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });
  
  next();
};

/**
 * 缓存日志辅助函数
 */
const cacheLogger = {
  hit: (key, type = 'data') => {
    logger.debug(`[Cache HIT] ${type}: ${key}`);
  },
  
  miss: (key, type = 'data') => {
    logger.info(`[Cache MISS] ${type}: ${key}`);
  },
  
  set: (key, ttl, type = 'data') => {
    logger.debug(`[Cache SET] ${type}: ${key} (TTL: ${ttl}s)`);
  },
  
  delete: (key) => {
    logger.debug(`[Cache DELETE] ${key}`);
  },
};

/**
 * API 调用日志辅助函数
 */
const apiLogger = {
  request: (service, endpoint, params = {}) => {
    logger.info(`[API Request] ${service} ${endpoint}`, { params });
  },
  
  success: (service, endpoint, duration) => {
    logger.info(`[API Success] ${service} ${endpoint} (${duration}ms)`);
  },
  
  error: (service, endpoint, error) => {
    logger.error(`[API Error] ${service} ${endpoint}`, {
      error: error.message,
      stack: error.stack,
    });
  },
};

/**
 * 性能监控日志
 */
const perfLogger = {
  start: (operation) => {
    return Date.now();
  },
  
  end: (operation, startTime) => {
    const duration = Date.now() - startTime;
    logger.info(`[Performance] ${operation} completed in ${duration}ms`);
    
    // 如果超过阈值，发出警告
    if (duration > 2000) {
      logger.warn(`[Performance] ${operation} is slow (${duration}ms)`);
    }
    
    return duration;
  },
};

module.exports = {
  logger,
  httpLogger,
  cacheLogger,
  apiLogger,
  perfLogger,
};
