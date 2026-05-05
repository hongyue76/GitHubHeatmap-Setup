# 项目使用指南

## 🎯 项目概述

这是一个功能完整的 GitHub 贡献热力图生成器，可以：
- 输入 GitHub 用户名获取贡献数据
- 生成类似 GitHub 原生的贡献热力图
- 按语言和项目分类统计
- 生成精美的分享卡片
- 支持多种颜色主题

## 🚀 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 配置（可选）
复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

在 `.env` 中添加 GitHub Token（推荐，可提高 API 速率限制）：
```
GITHUB_TOKEN=your_github_token_here
PORT=3000
```

> 获取 Token: https://github.com/settings/tokens

### 3. 启动服务
```bash
npm start
```

访问: http://localhost:3000

## 📖 使用步骤

### 网页界面使用

1. **输入用户名**
   - 在输入框中输入 GitHub 用户名（例如：octocat）
   - 按回车或点击"生成热力图"按钮

2. **选择颜色主题**
   - 默认绿色（GitHub 原生风格）
   - 蓝色（清新科技风）
   - 紫色（优雅现代风）
   - 橙色（活力温暖风）

3. **查看结果**
   - 用户信息和总贡献数
   - 贡献热力图（过去一年的提交记录）
   - 语言分布图（前 10 种编程语言）
   - 分享卡片（可分享到社交媒体）
   - 热门项目列表（前 10 个项目）

4. **下载图片**
   - 点击每个图表下方的"下载"按钮
   - 图片将以 SVG 格式保存

### API 接口使用

#### 1. 获取贡献数据
```bash
GET /api/contributions/:username
```

返回 JSON 格式的用户贡献数据、语言统计和项目信息。

#### 2. 生成热力图
```bash
GET /api/heatmap/:username?colorScheme=default
```

参数：
- `colorScheme`: default | blue | purple | orange

返回 SVG 格式的热力图。

#### 3. 生成语言分布图
```bash
GET /api/languages/:username
```

返回 SVG 格式的语言分布条形图。

#### 4. 生成分享卡片
```bash
GET /api/share-card/:username?colorScheme=default
```

返回 SVG 格式的精美分享卡片。

## 💡 示例

### 测试用户
可以尝试以下 GitHub 用户：
- `octocat` - GitHub 官方 mascot
- `torvalds` - Linux 创始人
- `yyx990803` - Vue.js 作者
- `gaearon` - React 核心成员

### cURL 示例

```bash
# 获取贡献数据
curl http://localhost:3000/api/contributions/octocat

# 生成热力图（蓝色主题）
curl http://localhost:3000/api/heatmap/octocat?colorScheme=blue -o heatmap.svg

# 生成语言分布图
curl http://localhost:3000/api/languages/octocat -o languages.svg

# 生成分享卡片
curl http://localhost:3000/api/share-card/octocat?colorScheme=purple -o share-card.svg
```

## 🔧 技术说明

### 架构设计
- **后端**: Node.js + Express
- **数据源**: GitHub REST API + GraphQL API
- **图像渲染**: SVG（无需原生依赖）
- **前端**: 纯 HTML/CSS/JavaScript

### 数据来源
1. **GraphQL API**（优先）
   - 获取详细的贡献日历数据
   - 包含每天的贡献数量和级别

2. **REST API**（降级方案）
   - 搜索用户的提交记录
   - 按日期聚合统计数据

3. **仓库信息**
   - 获取用户所有公开仓库
   - 统计各仓库的编程语言分布

### 数据处理
- 按日期组织贡献数据
- 计算语言使用比例（基于代码字节数）
- 统计项目热度（Star 和 Fork 数）
- 生成完整的时间序列（填补空白日期）

## ⚠️ 注意事项

### API 速率限制
- **未认证**: 每小时 60 次请求
- **已认证**: 每小时 5000 次请求
- 建议配置 `GITHUB_TOKEN` 以避免限流

### 数据限制
- 仅显示**公开仓库**的贡献
- 私有仓库的贡献不会计入
- 最多显示前 10 种语言和前 10 个项目

### 浏览器兼容性
- 现代浏览器均支持 SVG 显示
- Chrome、Firefox、Safari、Edge 完全兼容
- IE 11 及以下版本可能不支持

## 🎨 自定义

### 修改颜色主题
编辑 `services/dataProcessor.js` 中的 `getColorScheme()` 方法：

```javascript
custom: {
  NONE: '#ebedf0',
  FIRST_QUARTILE: '#your_color_1',
  SECOND_QUARTILE: '#your_color_2',
  THIRD_QUARTILE: '#your_color_3',
  FOURTH_QUARTILE: '#your_color_4'
}
```

### 调整图表尺寸
编辑 `services/heatmapRenderer.js` 中的渲染方法：

```javascript
// 热力图尺寸
width: 800,
height: 200

// 语言图尺寸
width: 400,
height: 300

// 分享卡片尺寸
width: 600,
height: 400
```

## 🐛 故障排除

### 问题 1: 找不到用户
**错误**: "用户不存在"
**解决**: 检查用户名拼写，确保是有效的 GitHub 用户名

### 问题 2: API 限流
**错误**: "API rate limit exceeded"
**解决**: 
- 等待一小时后重试
- 配置 GITHUB_TOKEN 提高限制

### 问题 3: 端口被占用
**错误**: "Port 3000 is already in use"
**解决**: 
- 修改 `.env` 中的 PORT 值
- 或关闭占用 3000 端口的程序

### 问题 4: 图片不显示
**原因**: 浏览器不支持 SVG
**解决**: 使用现代浏览器（Chrome、Firefox、Edge、Safari）

## 📊 性能优化

### 缓存策略
可以添加 Redis 或内存缓存来存储已查询的用户数据：

```javascript
const cache = new Map();

// 缓存 5 分钟
if (cache.has(username) && Date.now() - cache.get(username).timestamp < 300000) {
  return cache.get(username).data;
}
```

### 并发请求
使用 `Promise.all` 并行获取数据：

```javascript
const [userProfile, contributions, repos] = await Promise.all([
  githubService.getUserProfile(username),
  githubService.getContributions(username),
  githubService.getUserRepos(username)
]);
```

## 🤝 贡献代码

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

MIT License - 详见 LICENSE 文件

---

**祝你使用愉快！** 🎉

如有问题，请查看 README.md 或提交 Issue。
