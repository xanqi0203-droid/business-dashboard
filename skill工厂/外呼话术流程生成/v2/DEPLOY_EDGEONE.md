# EdgeOne Pages 部署指南

本项目已适配腾讯云 EdgeOne Pages，国内用户可直接访问，无需科学上网。

## 一、前置准备

1. **注册 EdgeOne Pages 账号**  
   访问 https://pages.edgeone.ai/ 注册账号（支持 GitHub 登录）

2. **安装 EdgeOne CLI（可选）**  
   ```bash
   npm install -g @edgeone/cli
   ```

## 二、项目结构说明

```
v2/
├── public/              # 静态资源（HTML/CSS/JS）
├── api/                 # 原 Vercel Functions（保留不动）
├── cloud-functions/     # EdgeOne Pages 适配层
│   └── [[default]].js   # Express 路由入口，自动加载所有 api/ 下的 handlers
├── edgeone.json         # EdgeOne Pages 配置
└── package.json
```

**关键改动**：
- 新增 `cloud-functions/[[default]].js` - 用 Express 包装所有 Vercel Functions
- 新增 `edgeone.json` - EdgeOne Pages 构建配置
- `api/` 目录下的业务代码**完全不动**，零改造成本

## 三、部署步骤

### 方式 A：通过 EdgeOne Pages 控制台部署（推荐）

1. **创建项目**  
   - 登录 https://pages.edgeone.ai/
   - 点击「新建项目」→「导入 Git 仓库」
   - 授权并选择本仓库

2. **配置构建**  
   - **框架预设**：选择「其他」或「静态站点」
   - **构建命令**：留空（无需构建）
   - **输出目录**：`public`
   - **Node.js 版本**：20.x

3. **配置环境变量**  
   在「项目设置」→「环境变量」中添加以下变量：

   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   JWT_SECRET=your-secret-key-min-32-chars-long
   LLM_BASE_URL=https://one.iflytek.com/api/llm/console/chat
   LLM_API_KEY=your-llm-api-key
   LLM_MODEL=claude-sonnet-4-6-20250514
   BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
   ```

   **注意**：
   - `OPENAI_API_KEY` 可选（知识库向量搜索用，不配置会降级到本地 MD5 embedding）
   - `BLOB_READ_WRITE_TOKEN` 用于文件上传（Vercel Blob），如不需要上传功能可不配

4. **部署**  
   - 点击「部署」按钮
   - 等待构建完成（约 1-2 分钟）
   - 获得访问链接：`https://your-project.edgeone.app`

### 方式 B：通过 CLI 部署

```bash
# 1. 登录
edgeone login

# 2. 初始化项目（首次）
edgeone init

# 3. 部署
edgeone deploy

# 4. 查看部署状态
edgeone list
```

## 四、验证部署

部署成功后，访问以下链接验证：

- **健康检查**：`https://your-project.edgeone.app/health`  
  应返回 `{"status":"ok","timestamp":"..."}`

- **登录接口**：`https://your-project.edgeone.app/api/auth/login`  
  POST 请求测试（需要先在数据库中创建测试用户）

- **前端页面**：`https://your-project.edgeone.app/`  
  应正常显示登录页

## 五、数据库连通性测试

EdgeOne Pages 的 Node Functions 运行在腾讯云香港/新加坡节点，访问 Neon PostgreSQL（美东）会有一定延迟。

**测试方法**：
1. 部署后访问 `/api/auth/me`（需先登录获取 token）
2. 观察响应时间：
   - < 500ms：可接受
   - 500ms - 1s：稍慢但可用
   - \> 1s：建议迁移到腾讯云/阿里云 PostgreSQL

**如需迁移数据库**：
```bash
# 1. 导出 Neon 数据
pg_dump $DATABASE_URL > backup.sql

# 2. 导入到腾讯云 Postgres
psql $NEW_DATABASE_URL < backup.sql

# 3. 更新 EdgeOne Pages 环境变量中的 DATABASE_URL
```

## 六、常见问题

### Q1: 部署后 API 返回 404
**A**: 检查 `edgeone.json` 中的 routes 配置是否正确，确保 `/api/*` 路由指向 `/cloud-functions/[[default]]`

### Q2: 环境变量不生效
**A**: EdgeOne Pages 环境变量需要在控制台配置，`.env.local` 文件不会被读取。部署后需重新部署才能生效。

### Q3: 数据库连接超时
**A**: Neon 免费版有连接数限制，检查是否达到上限。或考虑迁移到国内云数据库。

### Q4: LLM 调用失败
**A**: 确认 `LLM_API_KEY` 和 `LLM_BASE_URL` 配置正确，iFlytek 代理在国内可直接访问。

### Q5: 文件上传失败
**A**: Vercel Blob 在国内访问可能不稳定，建议替换为腾讯云 COS 或阿里云 OSS。

## 七、性能优化建议

1. **数据库**：迁移到腾讯云 PostgreSQL（香港/上海节点）
2. **文件存储**：替换 Vercel Blob 为腾讯云 COS
3. **CDN 加速**：EdgeOne Pages 自带全球 CDN，静态资源自动加速
4. **冷启动优化**：Node Functions 首次调用有冷启动（约 200-500ms），后续请求复用实例

## 八、回滚到 Vercel

如需回滚到 Vercel 部署，只需：
1. 删除 `cloud-functions/` 目录
2. 删除 `edgeone.json`
3. 继续使用 `vercel deploy`

原有 `api/` 目录代码完全兼容，无需任何修改。

---

**技术支持**：
- EdgeOne Pages 文档：https://pages.edgeone.ai/document
- 问题反馈：https://github.com/your-repo/issues
