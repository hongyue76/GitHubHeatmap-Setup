# 日志和错误监控系统

## ✅ 已完成的工作

### 1. **Winston 日志系统**
- ✅ `config/logger.js` - Winston 配置（207 行）
- ✅ 自动日志轮转（按天分割）
- ✅ 三级日志文件：
  - `error-YYYY-MM-DD.log` - 错误日志
  - `combined-YYYY-MM-DD.log` - 综合日志
  - `http-YYYY-MM-DD.log` - HTTP 请求日志

### 2. **错误监控服务**
- ✅ `services/errorMonitor.js` - 错误监控（175 行）
- ✅ 未捕获异常监听
- ✅ Promise 拒绝监听
- ✅ 优雅退出处理
- ✅ 错误统计 API

### 3. **集成到所有模块**
- ✅ Server.js - HTTP 日志中间件
- ✅ GitHub Service - 缓存日志
- ✅ 健康检查端点 - 错误统计

---

## 📊 日志系统架构

### 日志级别

```
error  → 只记录错误（写入 error-*.log + combined-*.log）
warn   → 警告信息
info   → 一般信息（写入 combined-*.log）
http   → HTTP 请求（写入 http-*.log）
debug  → 调试信息（仅开发环境）
```

### 日志文件结构

```
logs/
├── error-2026-04-29.log      # 错误日志（保留 30 天）
├── combined-2026-04-29.log   # 综合日志（保留 30 天）
├── http-2026-04-29.log       # HTTP 日志（保留 14 天）
└── *.audit.json              # 轮转审计文件
```

### 日志格式

```
2026-04-29 23:28:51 [INFO] Fetching contributions for: octocat
2026-04-29 23:28:51 [INFO] [Cache MISS] User Profile: user:profile:octocat
2026-04-29 23:28:56 [HTTP] GET /api/contributions/octocat {"method":"GET","url":"/api/contributions/octocat","status":200,"duration":"5099ms","ip":"::1"}
```

---

## 🔧 使用方法

### 1. 基本日志

```javascript
const { logger } = require('./config/logger');

logger.error('错误信息', { detail: '详细信息' });
logger.warn('警告信息');
logger.info('一般信息');
logger.http('HTTP 请求');
logger.debug('调试信息');
```

### 2. 缓存日志

```javascript
const { cacheLogger } = require('./config/logger');

cacheLogger.hit('user:profile:octocat', 'User Profile');
cacheLogger.miss('user:contributions:octocat', 'Contributions');
cacheLogger.set('key', 300, 'data');
cacheLogger.delete('key');
```

### 3. API 调用日志

```javascript
const { apiLogger } = require('./config/logger');

apiLogger.request('GitHub', '/users/octocat');
apiLogger.success('GitHub', '/users/octocat', 250);
apiLogger.error('GitHub', '/users/octocat', new Error('Failed'));
```

### 4. 性能监控

```javascript
const { perfLogger } = require('./config/logger');

const start = perfLogger.start('database query');
// ... 执行操作 ...
perfLogger.end('database query', start);
// 输出: [Performance] database query completed in 150ms
```

---

## 📈 错误监控

### 自动监控

系统自动监控：
- ✅ 未捕获的异常（uncaughtException）
- ✅ 未处理的 Promise 拒绝（unhandledRejection）
- ✅ Express 路由错误
- ✅ 进程信号（SIGTERM, SIGINT）

### 错误统计 API

```bash
# 获取错误统计（仅开发环境）
curl http://localhost:3000/api/errors
```

响应示例：
```json
{
  "success": true,
  "stats": {
    "totalErrors": 5,
    "errorsInMemory": 5,
    "errorsLastHour": 2,
    "errorsLast24Hours": 5,
    "recentErrors": [...]
  },
  "recentErrors": [
    {
      "timestamp": "2026-04-29T15:28:51.000Z",
      "message": "Request failed with status code 403",
      "stack": "...",
      "context": {
        "method": "GET",
        "url": "/api/contributions/octocat"
      }
    }
  ]
}
```

### 健康检查包含错误统计

```bash
curl http://localhost:3000/health
```

响应：
```json
{
  "status": "ok",
  "uptime": 1649.138,
  "version": "1.0.0",
  "monitoring": {
    "errors": {
      "total": 0,
      "lastHour": 0,
      "last24Hours": 0
    }
  }
}
```

---

## ⚙️ 配置说明

### 环境变量

```env
# 日志级别: error, warn, info, http, debug
LOG_LEVEL=info

# 生产环境
NODE_ENV=production
```

### 修改日志配置

编辑 `config/logger.js`:

```javascript
// 修改文件大小限制
maxSize: '20m',  // 改为 '50m'

// 修改保留天数
maxFiles: '30d', // 改为 '60d'

// 添加新的日志文件
new DailyRotateFile({
  filename: path.join(logDir, 'custom-%DATE%.log'),
  level: 'custom',
  maxSize: '10m',
  maxFiles: '7d',
})
```

---

## 🔍 日志查询和分析

### 查看实时日志

```bash
# Windows PowerShell
Get-Content logs/combined-2026-04-29.log -Wait -Tail 50

# Linux/Mac
tail -f logs/combined-2026-04-29.log
```

### 搜索错误

```bash
# 查找所有错误
grep "ERROR" logs/error-*.log

# 查找特定用户的错误
grep "octocat" logs/combined-*.log

# 统计错误数量
grep -c "ERROR" logs/error-2026-04-29.log
```

### 分析 HTTP 请求

```bash
# 查看慢请求（> 2000ms）
grep -E "duration\":\"[2-9][0-9]{3,}ms" logs/http-*.log

# 统计状态码
grep -oP '"status":\K[0-9]+' logs/http-*.log | sort | uniq -c

# 查看特定 IP 的请求
grep "::1" logs/http-*.log
```

---

## 🎯 日志最佳实践

### 1. 结构化日志

```javascript
// ✅ 好：结构化数据
logger.info('User login', {
  userId: 123,
  username: 'octocat',
  ip: '::1',
  userAgent: 'Mozilla/5.0'
});

// ❌ 差：字符串拼接
logger.info(`User ${userId} (${username}) logged in from ${ip}`);
```

### 2. 适当的日志级别

```javascript
// error: 系统错误、API 失败
logger.error('Database connection failed', { error });

// warn: 可恢复的问题、性能警告
logger.warn('Slow query detected', { duration: 3500 });

// info: 重要业务事件
logger.info('User registered', { userId });

// http: HTTP 请求（自动记录）
// debug: 详细调试信息
logger.debug('Cache key generated', { key });
```

### 3. 敏感信息脱敏

```javascript
// ❌ 不要记录密码、Token
logger.info('Login attempt', { password: 'secret123' });

// ✅ 只记录必要信息
logger.info('Login attempt', { 
  username: 'octocat',
  success: true 
});
```

---

## 🐛 故障排除

### Q1: 日志文件在哪里？

**A**: 在项目根目录的 `logs/` 文件夹中。

### Q2: 如何禁用日志？

**A**: 设置环境变量：
```env
LOG_LEVEL=none
```

### Q3: 日志文件太大怎么办？

**A**: 系统会自动轮转：
- 单个文件最大 20MB
- 超过后自动创建新文件
- 旧文件自动压缩（gzip）
- 超过保留天数自动删除

### Q4: 如何查看生产环境日志？

**A**: 
1. SSH 到服务器
2. 进入项目目录
3. 查看 `logs/` 文件夹
4. 或使用日志聚合工具（如 ELK、Sentry）

---

## 📊 监控指标

### 关键指标

| 指标 | 正常范围 | 告警阈值 |
|------|---------|---------|
| 错误率 | < 1% | > 5% |
| 平均响应时间 | < 500ms | > 2000ms |
| 缓存命中率 | > 80% | < 50% |
| 每小时错误数 | < 10 | > 50 |

### 监控命令

```bash
# 检查错误率
grep -c "ERROR" logs/error-$(date +%Y-%m-%d).log

# 检查平均响应时间
awk -F'"duration":"' '{print $2}' logs/http-*.log | awk -F'ms' '{sum+=$1; count++} END {print sum/count "ms"}'

# 检查缓存命中率
HIT=$(grep -c "Cache HIT" logs/combined-*.log)
MISS=$(grep -c "Cache MISS" logs/combined-*.log)
echo "Hit Rate: $(( HIT * 100 / (HIT + MISS) ))%"
```

---

## 🚀 高级功能

### 1. 日志聚合（未来）

可以集成：
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Sentry** - 错误追踪
- **Datadog** - 监控平台

### 2. 告警通知（未来）

```javascript
// 当错误率超过阈值时发送通知
if (errorRate > 5%) {
  sendAlert('High error rate detected!');
}
```

### 3. 分布式追踪（未来）

集成 OpenTelemetry 实现全链路追踪。

---

## 📝 总结

### 成果

✅ **完整的日志系统**: Winston + 文件轮转  
✅ **错误监控**: 自动捕获 + 统计分析  
✅ **HTTP 日志**: 请求详情 + 性能指标  
✅ **生产就绪**: 自动清理 + 压缩归档  

### 优势

- 📊 **结构化**: JSON 格式，易于分析
- 🔄 **自动化**: 自动轮转、压缩、清理
- 🔍 **可查询**: 支持 grep、awk 等工具
- 🛡️ **安全**: 生产环境隐藏敏感信息

---

**实施完成时间**: 2026-04-29  
**版本**: 1.2.0  
**日志状态**: 🟢 运行正常
