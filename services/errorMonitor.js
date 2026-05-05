const { logger } = require('../config/logger');

/**
 * 错误监控和上报服务
 */
class ErrorMonitor {
  constructor() {
    this.errorCount = 0;
    this.errors = [];
    this.maxErrors = 100; // 最多保留 100 条错误
    
    // 监听未捕获的异常
    process.on('uncaughtException', (error) => {
      this.handleUncaughtException(error);
    });
    
    // 监听未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnhandledRejection(reason, promise);
    });
    
    // 优雅退出
    process.on('SIGTERM', () => {
      logger.warn('Received SIGTERM signal, shutting down gracefully...');
      this.shutdown();
    });
    
    process.on('SIGINT', () => {
      logger.warn('Received SIGINT signal, shutting down gracefully...');
      this.shutdown();
    });
  }

  /**
   * 记录错误
   */
  recordError(error, context = {}) {
    this.errorCount++;
    
    const errorRecord = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      context,
      count: this.errorCount,
    };
    
    // 添加到错误列表
    this.errors.push(errorRecord);
    
    // 保持列表大小
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // 记录日志
    logger.error(`Error #${this.errorCount}: ${error.message}`, {
      ...context,
      stack: error.stack,
    });
    
    return errorRecord;
  }

  /**
   * 处理未捕获的异常
   */
  handleUncaughtException(error) {
    logger.error('Uncaught Exception:', {
      error: error.message,
      stack: error.stack,
    });
    
    this.recordError(error, { type: 'uncaught_exception' });
    
    // 紧急情况下退出进程
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }

  /**
   * 处理未处理的 Promise 拒绝
   */
  handleUnhandledRejection(reason, promise) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    logger.error('Unhandled Rejection:', {
      error: error.message,
      stack: error.stack,
    });
    
    this.recordError(error, { type: 'unhandled_rejection' });
  }

  /**
   * 获取错误统计
   */
  getStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(err => 
      new Date(err.timestamp) > twentyFourHoursAgo
    );
    
    const lastHourErrors = recentErrors.filter(err =>
      new Date(err.timestamp) > oneHourAgo
    );
    
    return {
      totalErrors: this.errorCount,
      errorsInMemory: this.errors.length,
      errorsLastHour: lastHourErrors.length,
      errorsLast24Hours: recentErrors.length,
      recentErrors: lastHourErrors.slice(-10), // 最近 10 条
    };
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(limit = 10) {
    return this.errors.slice(-limit);
  }

  /**
   * 清空错误记录
   */
  clearErrors() {
    this.errors = [];
    logger.info('Error records cleared');
  }

  /**
   * 优雅关闭
   */
  async shutdown() {
    logger.info('Shutting down error monitor...');
    
    // 可以在这里添加清理逻辑
    // 例如：发送最后的错误报告、关闭连接等
    
    process.exit(0);
  }

  /**
   * Express 错误处理中间件
   */
  expressErrorHandler() {
    return (err, req, res, next) => {
      // 记录错误
      this.recordError(err, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      // 生产环境不暴露详细错误信息
      const isProduction = process.env.NODE_ENV === 'production';
      
      res.status(err.statusCode || 500).json({
        success: false,
        error: isProduction ? 'Internal Server Error' : err.message,
        ...(isProduction ? {} : { stack: err.stack }),
      });
    };
  }
}

// 导出单例
module.exports = new ErrorMonitor();
