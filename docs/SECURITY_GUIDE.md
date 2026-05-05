# 安全中间件使用指南

## 📁 文件结构

```
middleware/
├── rateLimiter.js      # 速率限制
├── validation.js       # 输入验证
├── security.js         # HTTP 安全头
└── errorHandler.js     # 错误处理
```

---

## 🔧 使用方法

### 1. 速率限制

```javascript
const { apiLimiter, strictLimiter, gentleLimiter } = require('./middleware/rateLimiter');

// 在路由中使用
app.get('/api/data', apiLimiter, handler);
app.get('/api/generate', strictLimiter, handler);
```

**限流级别**：
- `apiLimiter`: 100 次/15分钟（通用 API）
- `strictLimiter`: 30 次/15分钟（图片生成等重操作）
- `gentleLimiter`: 200 次/15分钟（静态资源）

---

### 2. 输入验证

```javascript
const { validateUsername, validateColorScheme, handleValidationErrors } = require('./middleware/validation');

// 验证用户名
app.get('/api/user/:username', 
  validateUsername,
  handleValidationErrors,
  handler
);

// 验证查询参数
app.get('/api/image/:username',
  validateUsername,
  validateColorScheme,
  handleValidationErrors,
  handler
);
```

**验证规则**：
- 用户名：1-39 字符，仅字母/数字/连字符/下划线
- 颜色主题：default | blue | purple | orange

---

### 3. HTTP 安全头

```javascript
const securityHeaders = require('./middleware/security');

// 在所有路由之前使用
app.use(securityHeaders);
```

**自动添加的安全头**：
- Content-Security-Policy
- X-Frame-Options
- Strict-Transport-Security
- X-Content-Type-Options
- 等等...

---

### 4. 错误处理

```javascript
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 在所有路由之后使用
app.use(notFoundHandler);  // 404 处理
app.use(errorHandler);     // 全局错误处理
```

---

## 🧪 测试方法

### 运行安全测试

```bash
node test-security.js
```

### 手动测试

#### 测试速率限制
```bash
# 快速发送多个请求
for i in {1..35}; do
  curl http://localhost:3000/api/heatmap/octocat
done
```

#### 测试输入验证
```bash
# 无效用户名
curl http://localhost:3000/api/heatmap/<script>alert(1)</script>

# 超长用户名
curl http://localhost:3000/api/heatmap/$(python -c "print('a'*40)")

# 无效颜色主题
curl http://localhost:3000/api/heatmap/octocat?colorScheme=invalid
```

#### 检查安全头
```bash
curl -I http://localhost:3000/health
```

---

## ⚙️ 配置选项

### 修改速率限制

编辑 `middleware/rateLimiter.js`：

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 时间窗口（毫秒）
  max: 100,                   // 最大请求数
  message: {
    success: false,
    error: '自定义错误消息'
  }
});
```

### 修改验证规则

编辑 `middleware/validation.js`：

```javascript
const validateUsername = [
  param('username')
    .isLength({ min: 1, max: 50 })  // 修改长度限制
    .matches(/^[a-zA-Z0-9_-]+$/)    // 修改正则表达式
];
```

### 修改 CSP 策略

编辑 `middleware/security.js`：

```javascript
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      // 添加更多指令...
    }
  }
});
```

---

## 🐛 常见问题

### Q1: 为什么我的请求被限流了？

**A**: 检查以下事项：
1. 是否超过了速率限制阈值
2. 是否有多个标签页同时请求
3. 是否需要配置 GITHUB_TOKEN 提高限额

**解决**：
- 等待 15 分钟后重试
- 配置 `.env` 中的 `GITHUB_TOKEN`
- 调整速率限制参数

---

### Q2: 如何允许特定的跨域源？

**A**: 修改 `server.js` 中的 CORS 配置：

```javascript
app.use(cors({
  origin: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

或在 `.env` 中设置：
```env
CORS_ORIGIN=https://example.com
```

---

### Q3: 如何禁用某个安全头？

**A**: 编辑 `middleware/security.js`：

```javascript
const securityHeaders = helmet({
  frameguard: false,  // 禁用 X-Frame-Options
  // 其他配置...
});
```

---

### Q4: 生产环境如何配置？

**A**: 设置环境变量：

```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=50  # 更严格的限制
```

---

## 📊 监控和日志

### 查看限流统计

每个响应都会包含速率限制头：

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1617234567
```

### 记录被拦截的请求

在 `middleware/rateLimiter.js` 中添加：

```javascript
const apiLimiter = rateLimit({
  // ... 其他配置
  handler: (req, res) => {
    console.warn(`[Rate Limit] Blocked: ${req.ip} - ${req.path}`);
    res.status(429).json({
      success: false,
      error: '请求过于频繁'
    });
  }
});
```

---

## 🔐 安全最佳实践

### 1. 始终验证输入
```javascript
// ✅ 好的做法
app.get('/api/:username', validateUsername, handler);

// ❌ 不好的做法
app.get('/api/:username', handler);
```

### 2. 使用适当的限流级别
```javascript
// 重操作使用严格限流
app.get('/api/generate', strictLimiter, handler);

// 轻操作使用宽松限流
app.get('/api/info', gentleLimiter, handler);
```

### 3. 不要暴露敏感信息
```javascript
// ✅ 生产环境
if (process.env.NODE_ENV === 'production') {
  return res.status(500).json({ error: '服务器错误' });
}

// ❌ 开发环境才显示详情
return res.status(500).json({ error: err.stack });
```

### 4. 定期更新依赖
```bash
npm audit
npm update
```

---

## 📚 相关文档

- [Express Rate Limit 文档](https://github.com/nfriedly/express-rate-limit)
- [Helmet 文档](https://helmetjs.github.io/)
- [Express Validator 文档](https://express-validator.github.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**最后更新**: 2026-04-29  
**维护者**: Development Team
