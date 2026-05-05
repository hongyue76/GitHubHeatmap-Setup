# Windows 安装程序使用指南

## 📦 安装程序信息

**文件名**: `GitHubHeatmap-Setup.exe`  
**大小**: 4.58 MB  
**版本**: 1.2.0

---

## 🚀 安装步骤

### 方式 1：双击安装（推荐）

1. **双击** `GitHubHeatmap-Setup.exe`
2. 点击 **"下一步"**
3. 选择安装目录（默认: `C:\Program Files\GitHubHeatmap`）
4. 点击 **"安装"**
5. 等待安装完成
6. ✓ 自动启动并打开浏览器

### 方式 2：命令行安装

```cmd
GitHubHeatmap-Setup.exe /S
```

---

## 🎯 安装后

### 快捷方式位置

#### 桌面
- `GitHub Heatmap.lnk` - 一键启动

#### 开始菜单
```
开始 → GitHub Heatmap
├── Start.lnk          # 启动服务器
├── Stop.lnk           # 停止服务器
├── Uninstall.lnk      # 卸载程序
└── Open Browser.lnk   # 打开浏览器
```

### 安装目录

```
C:\Program Files\GitHubHeatmap\
├── node_modules/       # 依赖包
├── services/           # 服务模块
├── middleware/         # 中间件
├── config/            # 配置文件
├── public/            # 前端文件
├── logs/              # 日志文件
├── server.js          # 主程序
├── start.bat          # 启动脚本
├── stop.bat           # 停止脚本
├── uninstall.exe      # 卸载程序
└── .env               # 环境配置
```

---

## ❌ 卸载方法

### 方式 1：通过开始菜单

1. 开始菜单 → GitHub Heatmap → **Uninstall**
2. 确认卸载
3. ✓ 自动清理所有文件

### 方式 2：通过控制面板

1. 控制面板 → 程序和功能
2. 找到 **GitHub Contribution Heatmap**
3. 右键 → 卸载

### 方式 3：通过安装目录

1. 打开 `C:\Program Files\GitHubHeatmap\`
2. 双击 `uninstall.exe`
3. 确认卸载

### 方式 4：命令行卸载

```cmd
"C:\Program Files\GitHubHeatmap\uninstall.exe" /S
```

---

## 🔧 配置说明

### 编辑配置文件

安装后编辑：`C:\Program Files\GitHubHeatmap\.env`

```env
# GitHub Token（可选，提高 API 限额）
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 服务器端口
PORT=3000

# 环境
NODE_ENV=production
```

### 获取 GitHub Token

1. 访问: https://github.com/settings/tokens
2. 生成新 Token（只需 `public_repo` 权限）
3. 复制到 `.env` 文件

**效果**:
- 无 Token: 60 次/小时
- 有 Token: 5,000 次/小时

---

## 💡 常见问题

### Q1: 安装时提示需要管理员权限？

**A**: 正常。程序需要写入 `Program Files` 目录和注册表。

### Q2: 安装后无法启动？

**A**: 检查是否安装了 Node.js：
```cmd
node --version
```
如果未安装，请访问: https://nodejs.org/

### Q3: 如何修改端口？

**A**: 编辑 `.env` 文件，修改 `PORT=3000` 为其他端口，然后重启。

### Q4: 卸载后还有残留文件？

**A**: 手动删除：
```cmd
rmdir /s /q "C:\Program Files\GitHubHeatmap"
```

### Q5: 如何查看日志？

**A**: 日志位于：
```
C:\Program Files\GitHubHeatmap\logs\
├── combined-YYYY-MM-DD.log
├── error-YYYY-MM-DD.log
└── http-YYYY-MM-DD.log
```

---

## 📊 系统要求

| 项目 | 要求 |
|------|------|
| **操作系统** | Windows 7/8/10/11 |
| **Node.js** | v14.0 或更高版本 |
| **内存** | 最少 512 MB |
| **磁盘空间** | 最少 100 MB |
| **网络** | 需要访问 GitHub API |

---

## 🔒 安全说明

- ✅ 无恶意软件
- ✅ 无广告
- ✅ 无后台进程（关闭即停止）
- ✅ 本地运行，数据不上传
- ✅ 开源代码可审查

---

## 📞 技术支持

- **问题反馈**: 提交 Issue
- **文档**: 查看 `API_DOCUMENTATION.md`
- **日志**: 检查 `logs/` 目录

---

**最后更新**: 2026-05-01  
**版本**: 1.2.0
