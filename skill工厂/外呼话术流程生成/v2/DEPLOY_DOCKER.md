# Docker 部署到国内云服务器指南

本指南帮助你将项目部署到阿里云/腾讯云等国内云服务器，获得一个国内可直接访问的链接。

## 📋 前置准备

### 1. 购买云服务器

推荐配置：
- **CPU**：2核
- **内存**：2GB
- **带宽**：1-3Mbps
- **系统**：Ubuntu 22.04 / CentOS 8
- **费用**：约 30-60 元/月

推荐平台：
- 阿里云轻量应用服务器：https://www.aliyun.com/product/swas
- 腾讯云轻量应用服务器：https://cloud.tencent.com/product/lighthouse

### 2. 服务器安全组配置

在云服务器控制台开放以下端口：
- **3000**：应用端口（必须）
- **22**：SSH 端口（管理用）

## 🚀 部署步骤

### 方式 A：一键部署脚本（推荐）

1. **SSH 连接到服务器**
   ```bash
   ssh root@你的服务器IP
   ```

2. **下载并运行部署脚本**
   ```bash
   # 下载部署脚本
   wget https://raw.githubusercontent.com/xanqi0203-droid/business-dashboard/main/skill工厂/外呼话术流程生成/v2/deploy.sh
   
   # 或使用 curl
   curl -O https://raw.githubusercontent.com/xanqi0203-droid/business-dashboard/main/skill工厂/外呼话术流程生成/v2/deploy.sh
   
   # 赋予执行权限
   chmod +x deploy.sh
   
   # 运行部署脚本
   ./deploy.sh
   ```

3. **配置环境变量**
   
   脚本会提示你输入以下环境变量：
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   LLM_BASE_URL=https://one.iflytek.com/api/llm/console/chat
   LLM_API_KEY=...
   LLM_MODEL=claude-sonnet-4-6-20250514
   ```

4. **等待部署完成**
   
   部署成功后，你会看到：
   ```
   ✅ 部署成功！
   🌐 访问地址：http://你的服务器IP:3000
   📊 健康检查：http://你的服务器IP:3000/health
   ```

### 方式 B：手动部署

#### 步骤 1：安装 Docker

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 步骤 2：克隆代码

```bash
# 安装 Git
sudo apt install git -y

# 克隆仓库
git clone https://github.com/xanqi0203-droid/business-dashboard.git
cd business-dashboard/skill工厂/外呼话术流程生成/v2
```

#### 步骤 3：配置环境变量

```bash
# 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=your-secret-key-min-32-chars-long
LLM_BASE_URL=https://one.iflytek.com/api/llm/console/chat
LLM_API_KEY=your-llm-api-key
LLM_MODEL=claude-sonnet-4-6-20250514
BLOB_READ_WRITE_TOKEN=your-blob-token
OPENAI_API_KEY=sk-xxx
EOF

# 编辑 .env 文件，填入真实的环境变量值
nano .env
```

#### 步骤 4：构建并启动

```bash
# 构建 Docker 镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 步骤 5：验证部署

```bash
# 健康检查
curl http://localhost:3000/health

# 应返回：{"status":"ok","timestamp":"...","uptime":...}
```

## 🌐 访问应用

部署成功后，通过以下地址访问：

- **应用首页**：`http://你的服务器IP:3000`
- **健康检查**：`http://你的服务器IP:3000/health`
- **API 接口**：`http://你的服务器IP:3000/api/...`

## 🔧 常用管理命令

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 停止并删除容器
docker-compose down

# 更新代码并重新部署
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

## 🔒 绑定域名（可选）

如果你有域名，可以绑定到服务器：

### 1. 域名解析

在域名服务商（阿里云/腾讯云）添加 A 记录：
```
类型：A
主机记录：@ 或 www
记录值：你的服务器IP
TTL：600
```

### 2. 安装 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install nginx -y

# 创建配置文件
sudo nano /etc/nginx/sites-available/bank-ops

# 粘贴以下配置：
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/bank-ops /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 自动配置 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 证书会自动续期
```

配置完成后，访问：`https://your-domain.com`

## 📊 监控和日志

### 查看实时日志
```bash
docker-compose logs -f app
```

### 查看资源使用
```bash
docker stats
```

### 查看容器详情
```bash
docker inspect v2_app_1
```

## 🐛 故障排查

### 问题 1：容器启动失败
```bash
# 查看详细日志
docker-compose logs app

# 检查环境变量
docker-compose config
```

### 问题 2：端口被占用
```bash
# 查看端口占用
sudo lsof -i :3000

# 修改 docker-compose.yml 中的端口映射
ports:
  - "8080:3000"  # 改用 8080 端口
```

### 问题 3：数据库连接失败
```bash
# 测试数据库连接
docker-compose exec app node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT 1\`.then(() => console.log('✓ DB OK')).catch(e => console.error('✗ DB Error:', e));
"
```

### 问题 4：内存不足
```bash
# 查看内存使用
free -h

# 限制容器内存（修改 docker-compose.yml）
services:
  app:
    mem_limit: 512m
```

## 🔄 自动更新部署

创建自动更新脚本：

```bash
# 创建更新脚本
cat > update.sh << 'EOF'
#!/bin/bash
cd /root/business-dashboard/skill工厂/外呼话术流程生成/v2
git pull
docker-compose down
docker-compose build
docker-compose up -d
echo "✅ 更新完成"
EOF

chmod +x update.sh

# 每次更新时运行
./update.sh
```

## 💰 成本估算

- **云服务器**：30-60 元/月
- **域名**（可选）：50-100 元/年
- **SSL 证书**：免费（Let's Encrypt）
- **总计**：约 30-60 元/月

## 📞 技术支持

- 查看详细文档：[DEPLOY_EDGEONE.md](DEPLOY_EDGEONE.md)
- GitHub Issues：https://github.com/xanqi0203-droid/business-dashboard/issues

---

## ✅ 部署检查清单

- [ ] 云服务器已购买并配置安全组
- [ ] Docker 和 Docker Compose 已安装
- [ ] 代码已克隆到服务器
- [ ] 环境变量已正确配置
- [ ] 容器已成功启动
- [ ] 健康检查接口返回正常
- [ ] 前端页面可以访问
- [ ] 登录功能正常
- [ ] API 接口正常响应
- [ ] （可选）域名已绑定
- [ ] （可选）HTTPS 已配置

完成以上步骤后，你就拥有了一个国内可直接访问的银行客户运营系统！
