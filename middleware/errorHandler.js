/**
 * 全局错误处理中间件
 * 统一处理所有未捕获的错误
 */

const errorHandler = (err, req, res, next) => {
  // 记录错误（生产环境应该写入日志文件）
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // 根据错误类型返回不同的响应
  if (err.type === 'entity.parse.failed') {
    // JSON 解析错误
    return res.status(400).json({
      success: false,
      error: '请求数据格式错误'
    });
  }

  if (err.status) {
    // 已知错误
    return res.status(err.status).json({
      success: false,
      error: err.message
    });
  }

  // 未知错误（生产环境不暴露详细信息）
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message
  });
};

/**
 * 404 处理中间件
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `路由 ${req.method} ${req.path} 不存在`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
