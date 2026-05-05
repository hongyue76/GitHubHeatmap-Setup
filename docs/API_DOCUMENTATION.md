# GitHub Contribution Heatmap API 文档

**版本**: 1.2.0  
**基础 URL**: `http://localhost:3000`  
**协议**: HTTP/HTTPS

---

## 📋 目录

- [认证](#认证)
- [速率限制](#速率限制)
- [错误处理](#错误处理)
- [API 端点](#api-端点)
  - [获取用户贡献数据](#获取用户贡献数据)
  - [生成热力图 SVG](#生成热力图-svg)
  - [生成语言分布图](#生成语言分布图)
  - [生成分享卡片](#生成分享卡片)
  - [健康检查](#健康检查)
  - [错误统计](#错误统计)

---

## 🔐 认证

当前 API **无需认证**即可使用。

### 可选：GitHub Token

为提高 API 调用限额，可在 `.env` 中配置：

```env
GITHUB_TOKEN=your_github_personal_access_token
```

**限额对比**：
- 无 Token: 60 次/小时
- 有 Token: 5,000 次/小时

---

## ⚡ 速率限制

| 端点类型 | 限制 | 时间窗口 |
|---------|------|---------|
| 通用 API | 100 次 | 15 分钟 |
| SVG 生成 | 30 次 | 15 分钟 |
| 图片下载 | 200 次 | 15 分钟 |

**超限响应**：
```json
{
  "success": false,
  "error": "请求过于频繁，请稍后再试",
  "retryAfter": "15 minutes"
}
```

**HTTP 头信息**：
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1714435200
```

---

## ❌ 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述",
  "details": [
    {
      "field": "username",
      "message": "用户名格式不正确"
    }
  ]
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在（用户不存在） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 📡 API 端点

### 获取用户贡献数据

获取指定 GitHub 用户的贡献数据、语言统计和项目统计。

**端点**: `GET /api/contributions/:username`

**参数**:
- `username` (路径参数, 必需): GitHub 用户名

**响应**:
```json
{
  "success": true,
  "data": {
    "userProfile": {
      "login": "octocat",
      "name": "The Octocat",
      "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
      "bio": "Hello World",
      "public_repos": 100,
      "followers": 10000,
      "following": 100
    },
    "totalContributions": 15234,
    "heatmapData": [
      {
        "date": "2026-04-29",
        "count": 5,
        "level": "FIRST_QUARTILE"
      }
    ],
    "languageStats": [
      {
        "name": "JavaScript",
        "bytes": 1234567,
        "percentage": 45.5
      },
      {
        "name": "Python",
        "bytes": 987654,
        "percentage": 35.2
      }
    ],
    "projectStats": [
      {
        "name": "repo-name",
        "contributions": 150,
        "languages": ["JavaScript", "TypeScript"]
      }
    ]
  }
}
```

**缓存**: 10 分钟  
**示例**:
```bash
curl http://localhost:3000/api/contributions/octocat
```

---

### 生成热力图 SVG

生成类似 GitHub 的贡献热力图 SVG 图像。

**端点**: `GET /api/heatmap/:username`

**参数**:
- `username` (路径参数, 必需): GitHub 用户名
- `colorScheme` (查询参数, 可选): 颜色主题，默认 `default`

**支持的颜色主题**:
- `default` - GitHub 默认绿色
- `blue` - 蓝色系
- `purple` - 紫色系
- `orange` - 橙色系
- `pink` - 粉色系

**响应**: `image/svg+xml`

**示例**:
```bash
# 默认主题
curl http://localhost:3000/api/heatmap/octocat -o heatmap.svg

# 蓝色主题
curl "http://localhost:3000/api/heatmap/octocat?colorScheme=blue" -o heatmap-blue.svg
```

**在 HTML 中使用**:
```html
<img src="http://localhost:3000/api/heatmap/octocat" alt="Contribution Heatmap" />

<!-- 或者嵌入 SVG -->
<object data="http://localhost:3000/api/heatmap/octocat?colorScheme=purple" type="image/svg+xml"></object>
```

**缓存**: 30 分钟（按用户名+主题隔离）

---

### 生成语言分布图

生成用户仓库语言分布的柱状图 SVG。

**端点**: `GET /api/languages/:username`

**参数**:
- `username` (路径参数, 必需): GitHub 用户名

**响应**: `image/svg+xml`

**示例**:
```bash
curl http://localhost:3000/api/languages/octocat -o languages.svg
```

**在 README 中使用**:
```markdown
![Language Stats](http://localhost:3000/api/languages/octocat)
```

**缓存**: 30 分钟

---

### 生成分享卡片

生成包含用户信息、贡献统计和语言分布的综合分享卡片。

**端点**: `GET /api/share-card/:username`

**参数**:
- `username` (路径参数, 必需): GitHub 用户名
- `colorScheme` (查询参数, 可选): 颜色主题，默认 `default`

**响应**: `image/svg+xml`

**示例**:
```bash
curl http://localhost:3000/api/share-card/octocat -o share-card.svg
```

**社交媒体分享**:
```html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="http://localhost:3000/api/share-card/octocat" />

<!-- Open Graph -->
<meta property="og:image" content="http://localhost:3000/api/share-card/octocat" />
```

**缓存**: 30 分钟（按用户名+主题隔离）

---

### 健康检查

检查服务器运行状态和监控信息。

**端点**: `GET /health`

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-29T15:28:47.848Z",
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

**用途**:
- 负载均衡器健康检查
- 监控系统集成
- 服务可用性检测

**示例**:
```bash
curl http://localhost:3000/health
```

---

### 错误统计

获取最近的错误记录（仅开发环境）。

**端点**: `GET /api/errors`

**权限**: 仅开发环境可用（生产环境返回 403）

**响应**:
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
      "stack": "Error: Request failed...\n    at ...",
      "context": {
        "method": "GET",
        "url": "/api/contributions/octocat",
        "ip": "::1"
      },
      "count": 1
    }
  ]
}
```

**示例**:
```bash
curl http://localhost:3000/api/errors
```

---

## 🎨 颜色主题示例

### default (GitHub 绿)
```
Level 0: #ebedf0 (无色)
Level 1: #9be9a8 (浅绿)
Level 2: #40c463 (中绿)
Level 3: #30a14e (深绿)
Level 4: #216e39 (最深绿)
```

### blue
```
Level 0: #ebedf0
Level 1: #9ecbff
Level 2: #54aeff
Level 3: #0969da
Level 4: #0a3069
```

### purple
```
Level 0: #ebedf0
Level 1: #d8b4fe
Level 2: #a855f7
Level 3: #7c3aed
Level 4: #581c87
```

---

## 💡 使用示例

### JavaScript/Node.js

```javascript
const axios = require('axios');

// 获取贡献数据
async function getContributions(username) {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/contributions/${username}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch contributions:', error.message);
  }
}

// 下载热力图 SVG
async function downloadHeatmap(username, colorScheme = 'default') {
  const response = await axios.get(
    `http://localhost:3000/api/heatmap/${username}?colorScheme=${colorScheme}`,
    { responseType: 'text' }
  );
  
  const fs = require('fs');
  fs.writeFileSync(`${username}-heatmap.svg`, response.data);
}

// 使用
getContributions('octocat').then(data => {
  console.log(`Total contributions: ${data.totalContributions}`);
});

downloadHeatmap('octocat', 'blue');
```

### Python

```python
import requests
import json

# 获取贡献数据
def get_contributions(username):
    url = f"http://localhost:3000/api/contributions/{username}"
    response = requests.get(url)
    
    if response.status_code == 200:
        return response.json()['data']
    else:
        raise Exception(f"API Error: {response.status_code}")

# 下载热力图
def download_heatmap(username, color_scheme='default'):
    url = f"http://localhost:3000/api/heatmap/{username}?colorScheme={color_scheme}"
    response = requests.get(url)
    
    if response.status_code == 200:
        with open(f"{username}-heatmap.svg", "w") as f:
            f.write(response.text)
    else:
        raise Exception(f"API Error: {response.status_code}")

# 使用
data = get_contributions('octocat')
print(f"Total contributions: {data['totalContributions']}")

download_heatmap('octocat', 'purple')
```

### cURL

```bash
# 获取 JSON 数据
curl http://localhost:3000/api/contributions/octocat | jq .

# 下载 SVG 文件
curl http://localhost:3000/api/heatmap/octocat -o heatmap.svg

# 指定颜色主题
curl "http://localhost:3000/api/heatmap/octocat?colorScheme=blue" -o heatmap-blue.svg

# 检查健康状态
curl http://localhost:3000/health | jq .
```

### 前端集成

```html
<!DOCTYPE html>
<html>
<head>
  <title>GitHub Stats</title>
</head>
<body>
  <h1>My GitHub Contributions</h1>
  
  <!-- 热力图 -->
  <img 
    src="http://localhost:3000/api/heatmap/octocat?colorScheme=default" 
    alt="Contribution Heatmap"
    width="800"
  />
  
  <!-- 语言分布 -->
  <img 
    src="http://localhost:3000/api/languages/octocat" 
    alt="Language Distribution"
    width="400"
  />
  
  <!-- 分享卡片 -->
  <img 
    src="http://localhost:3000/api/share-card/octocat" 
    alt="Share Card"
    width="600"
  />
  
  <script>
    // 动态加载数据
    fetch('http://localhost:3000/api/contributions/octocat')
      .then(res => res.json())
      .then(data => {
        console.log('Total contributions:', data.data.totalContributions);
      });
  </script>
</body>
</html>
```

---

## 🔧 高级用法

### 批量获取多个用户

```javascript
const users = ['octocat', 'torvalds', 'gaearon'];

Promise.all(users.map(async username => {
  const response = await fetch(
    `http://localhost:3000/api/contributions/${username}`
  );
  return response.json();
})).then(results => {
  results.forEach(result => {
    console.log(`${result.data.userProfile.login}: ${result.data.totalContributions} contributions`);
  });
});
```

### 自定义缓存控制

SVG 端点已设置缓存头：
```
Cache-Control: public, max-age=3600
```

浏览器会自动缓存 1 小时。如需强制刷新：
```bash
curl -H "Cache-Control: no-cache" http://localhost:3000/api/heatmap/octocat
```

### 错误重试

```javascript
async function fetchWithRetry(username, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/contributions/${username}`
      );
      
      if (response.status === 429) {
        // 速率限制，等待后重试
        const retryAfter = response.headers.get('Retry-After') || 60;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

---

## 📊 性能优化建议

### 1. 利用缓存

- 首次请求较慢（需调用 GitHub API）
- 后续请求从缓存读取（< 50ms）
- 相同用户+主题的 SVG 会被缓存 30 分钟

### 2. 减少请求频率

```javascript
// ❌ 不好：频繁请求
setInterval(() => fetchHeatmap(), 1000);

// ✅ 好：按需请求，利用缓存
const heatmap = await fetchHeatmap();
// 30 分钟内再次请求会直接从缓存返回
```

### 3. 预加载热门用户

```javascript
// 应用启动时预加载
const popularUsers = ['octocat', 'torvalds'];
popularUsers.forEach(user => {
  fetch(`http://localhost:3000/api/heatmap/${user}`);
});
```

---

## 🐛 常见问题

### Q1: 为什么返回 403 错误？

**A**: GitHub API 速率限制。解决方案：
1. 配置 `GITHUB_TOKEN` 环境变量
2. 等待 1 小时后重试
3. 使用缓存减少 API 调用

### Q2: SVG 图像不显示？

**A**: 检查以下几点：
1. 确认 Content-Type 为 `image/svg+xml`
2. 检查浏览器控制台是否有 CORS 错误
3. 验证用户名是否正确

### Q3: 如何更改颜色主题？

**A**: 添加查询参数：
```
/api/heatmap/octocat?colorScheme=blue
```

### Q4: 缓存何时失效？

**A**: 
- 用户数据: 10 分钟后
- SVG 图像: 30 分钟后
- 手动清除: 重启服务器

### Q5: 支持 HTTPS 吗？

**A**: 当前仅支持 HTTP。生产环境建议使用 Nginx 反向代理添加 HTTPS。

---

## 📝 更新日志

### v1.2.0 (2026-04-29)
- ✨ 添加 Winston 日志系统
- ✨ 添加错误监控服务
- ✨ 健康检查包含错误统计
- ✨ 新增 `/api/errors` 端点

### v1.1.0 (2026-04-29)
- ✨ 添加 Redis 缓存机制
- ✨ 性能提升 87-98%
- ✨ 自动降级到内存缓存

### v1.0.0 (2026-04-29)
- 🎉 初始版本发布
- ✨ 基础 API 功能
- ✨ 安全性加固
- ✨ SVG 渲染引擎

---

## 📞 支持

- **问题反馈**: 提交 Issue
- **文档**: 查看项目 README
- **日志**: 检查 `logs/` 目录

---

**最后更新**: 2026-04-29  
**维护者**: GitHub Contribution Heatmap Team
