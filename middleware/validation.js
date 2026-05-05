const { body, param, query, validationResult } = require('express-validator');

/**
 * 输入验证中间件
 * 防止 XSS、注入攻击和无效输入
 */

/**
 * 验证 GitHub 用户名参数
 * GitHub 用户名规则：
 * - 1-39 个字符
 * - 只能包含字母、数字、连字符和下划线
 * - 不能以连字符开头或结尾
 */
const validateUsername = [
  param('username')
    .trim()
    .isLength({ min: 1, max: 39 })
    .withMessage('用户名长度必须在 1-39 个字符之间')
    .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/)
    .withMessage('用户名只能包含字母、数字、连字符和下划线，且不能以连字符开头或结尾')
    .escape(), // XSS 防护
];

/**
 * 验证颜色主题参数
 */
const validateColorScheme = [
  query('colorScheme')
    .optional()
    .isIn(['default', 'blue', 'purple', 'orange'])
    .withMessage('颜色主题必须是: default, blue, purple, orange 之一')
    .escape(),
];

/**
 * 检查验证结果
 * 如果有错误，返回 400 响应
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: '输入验证失败',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * 通用 sanitization 函数
 * 清理字符串中的危险字符
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/[<>]/g, '') // 移除 < 和 >
    .replace(/javascript:/gi, '') // 移除 javascript: 协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
    .trim();
};

module.exports = {
  validateUsername,
  validateColorScheme,
  handleValidationErrors,
  sanitizeInput
};
