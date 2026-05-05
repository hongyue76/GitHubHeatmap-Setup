# GitHub 贡献热力图生成器

一个功能完整的 GitHub 贡献数据可视化工具，可以生成类似 GitHub 原生的贡献热力图、语言分布图和分享卡片。

## ✨ 功能特性

- 🔍 **输入用户名获取数据** - 通过 GitHub API 爬取用户提交数据
- 📊 **贡献热力图** - 生成类似 GitHub 的贡献日历，支持多种颜色主题
- 🎨 **按语言/项目分类** - 统计并可视化编程语言分布和热门项目
- 🖼️ **分享卡片生成** - 创建精美的个人贡献统计卡片
- 💾 **图片下载** - 一键下载生成的所有图表

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置（可选）

复制 `.env.example` 为 `.env` 文件：

```bash
cp .env.example .env
```

在 `.env` 文件中添加你的 GitHub Token（可选，但推荐）：

```
GITHUB_TOKEN=your_github_token_here
PORT=3000
```

> 获取 GitHub Token: https://github.com/settings/tokens

### 启动服务

```bash
npm start
```

或者开发模式：

```bash
npm run dev
```

访问 http://localhost:3000

### Windows 用户（推荐）

直接下载并运行安装程序：

```bash
GitHubHeatmap-Setup.exe
```

详见 [docs/INSTALLER_GUIDE.md](./docs/INSTALLER_GUIDE.md)

## 📚 文档

**快速导航**: [📑 文档中心](./docs/DOCS_INDEX.md)

### 入门文档
- [🛠️ 安装指南](./docs/INSTALLER_GUIDE.md) - Windows 安装程序
- [📘 使用手册](./docs/USAGE.md) - 详细使用说明
- [📖 功能演示](./docs/DEMO.md) - 示例和截图

### 开发文档
- [📡 API 文档](./docs/API_DOCUMENTATION.md) - 完整 API 参考
- [🏗️ 架构说明](./docs/简介.md) - 技术架构和设计决策

### 运维文档
- [🔒 安全指南](./docs/SECURITY_GUIDE.md) - 安全配置
- [📊 日志系统](./docs/LOGGING_GUIDE.md) - 日志和监控
- [⚡ 缓存优化](./docs/CACHE_SUMMARY.md) - 性能优化

1. 在输入框中输入 GitHub 用户名
2. 选择喜欢的颜色主题（默认绿色、蓝色、紫色、橙色）
3. 点击"生成热力图"按钮
4. 查看生成的：
   - 用户信息和总贡献数
   - 贡献热力图
   - 语言分布图
   - 分享卡片
   - 热门项目列表
5. 点击下载按钮保存任意图片

## 🛠️ API 接口

### 获取贡献数据
```
GET /api/contributions/:username
```

### 生成热力图图片
```
GET /api/heatmap/:username?colorScheme=default
```
参数: `colorScheme` - default | blue | purple | orange

### 生成语言分布图
```
GET /api/languages/:username
```

### 生成分享卡片
```
GET /api/share-card/:username?colorScheme=default
```

## 🏗️ 技术栈

- **后端**: Node.js + Express
- **数据处理**: Axios (GitHub API)
- **图像渲染**: Canvas
- **前端**: HTML5 + CSS3 + Vanilla JavaScript

## 📁 项目结构

```
项目四/
├── services/
│   ├── githubService.js      # GitHub API 服务
│   ├── dataProcessor.js      # 数据处理逻辑
│   └── heatmapRenderer.js    # 热力图渲染引擎
├── public/
│   ├── index.html            # 前端页面
│   ├── style.css             # 样式文件
│   └── app.js                # 前端交互逻辑
├── server.js                 # 主服务器文件
├── package.json              # 项目配置
└── .env.example              # 环境变量示例
```

## 🎨 颜色主题

- **默认绿色** - GitHub 原生风格
- **蓝色** - 清新科技风
- **紫色** - 优雅现代风
- **橙色** - 活力温暖风

## ⚠️ 注意事项

1. **API 速率限制**: 
   - 未认证: 每小时 60 次请求
   - 已认证: 每小时 5000 次请求
   - 建议配置 GITHUB_TOKEN

2. **Canvas 依赖**: 
   - Windows 用户可能需要安装构建工具
   - 如遇问题，运行: `npm install --global windows-build-tools`

3. **隐私仓库**: 
   - 只能获取公开仓库的贡献数据
   - 私有仓库贡献不会显示

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

Made with ❤️ for GitHub developers
