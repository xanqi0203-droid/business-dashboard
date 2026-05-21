# 阿里云轻量应用服务器部署指南

## 📍 第一步：购买阿里云轻量应用服务器

### 1. 访问购买页面

在浏览器中打开：**https://swas.console.aliyun.com/**

或者在你当前的阿里云控制台：
1. 点击左上角的 **☰ 菜单图标**
2. 在搜索框输入 **"轻量应用服务器"**
3. 点击进入轻量应用服务器控制台

### 2. 创建服务器实例

点击 **"创建服务器"** 或 **"购买实例"** 按钮，然后配置：

| 配置项 | 推荐选择 | 说明 |
|--------|---------|------|
| **地域** | 华东1（杭州）或 华北2（北京） | 选择离你最近的地域 |
| **镜像类型** | 系统镜像 | 不要选应用镜像 |
| **镜像** | **Ubuntu 22.04** | 必须选择这个版本 |
| **套餐** | 2核2GB，3Mbps | 约 50-60 元/月 |
| **购买时长** | 1个月 | 可以先买1个月测试 |

### 3. 完成购买

- 勾选服务协议
- 点击 **"立即购买"**
- 完成支付

购买成功后，等待 1-2 分钟实例创建完成。

---

## 🔑 第二步：设置服务器密码

1. 在 **轻量应用服务器控制台**，找到你刚创建的实例
2. 点击实例卡片进入详情页
3. 找到 **"重置密码"** 按钮（通常在页面右上角或实例信息区域）
4. 设置一个新密码（用于远程连接）
5. 点击确定后，**重启实例**（密码才会生效）

---

## 🌐 第三步：配置安全组（开放端口）

1. 在实例详情页，找到 **"防火墙"** 或 **"安全组"** 标签
2. 点击 **"添加规则"**
3. 添加以下规则：

| 应用类型 | 协议 | 端口范围 | 授权对象 | 说明 |
|---------|------|---------|---------|------|
| 自定义 | TCP | 3000 | 0.0.0.0/0 | 应用访问端口 |

4. 点击 **"确定"** 保存

---

## 💻 第四步：远程连接到服务器

### 方式 1：使用阿里云网页终端（推荐，最简单）

1. 在实例详情页，找到 **"远程连接"** 按钮
2. 点击后选择 **"通过 Workbench 远程连接"**
3. 输入用户名：`root`
4. 输入密码：你在第二步设置的密码
5. 点击 **"确定"**，进入网页终端

### 方式 2：使用本地终端 SSH 连接

如果你熟悉命令行，也可以在你的 Mac 终端执行：

```bash
ssh root@你的服务器公网IP
# 输入密码后回车
```

---

## 🚀 第五步：执行一键部署脚本

在打开的终端（网页终端或本地终端）中，**复制粘贴**以下命令：

```bash
curl -fsSL https://raw.githubusercontent.com/xanqi0203-droid/business-dashboard/main/skill工厂/外呼话术流程生成/v2/deploy.sh -o deploy.sh && chmod +x deploy.sh && ./deploy.sh
```

按回车执行。

---

## ⚙️ 第六步：配置环境变量

脚本会提示你输入以下环境变量。**请从你本地的 `.env.local` 文件中复制对应的值**：

### 必填项：

1. **DATABASE_URL**（Neon PostgreSQL 连接串）
   ```
   示例：postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

2. **JWT_SECRET**（至少32位随机字符串）
   ```
   示例：your-secret-key-min-32-chars-long-random-string
   ```

3. **LLM_BASE_URL**（直接回车使用默认值）
   ```
   默认：https://one.iflytek.com/api/llm/console/chat
   ```

4. **LLM_API_KEY**（你的讯飞 API Key）
   ```
   从你的 .env.local 文件复制
   ```

5. **LLM_MODEL**（直接回车使用默认值）
   ```
   默认：claude-sonnet-4-6-20250514
   ```

### 可选项（直接回车跳过）：

6. **BLOB_READ_WRITE_TOKEN**（Vercel Blob，文件上传功能需要）
7. **OPENAI_API_KEY**（向量搜索功能需要，不配置会降级到本地）

---

## ✅ 第七步：等待部署完成

脚本会自动：
- ✅ 安装 Docker 和 Docker Compose
- ✅ 安装 Git
- ✅ 克隆代码
- ✅ 构建 Docker 镜像
- ✅ 启动服务

大约需要 **3-5 分钟**。

部署成功后，你会看到：

```
==========================================
✅ 部署成功！
==========================================

🌐 访问地址：
   http://你的服务器IP:3000

📊 健康检查：
   http://你的服务器IP:3000/health

📝 常用命令：
   查看日志: docker-compose logs -f
   重启服务: docker-compose restart
   停止服务: docker-compose stop
==========================================
```

---

## 🎉 第八步：访问你的应用

在浏览器中打开：

```
http://你的服务器公网IP:3000
```

你应该能看到登录页面！

**这个链接国内可以直接访问，无需科学上网！**

---

## 🔍 如何查看服务器公网 IP

在阿里云轻量应用服务器控制台：
1. 进入实例详情页
2. 在 **"实例信息"** 区域
3. 找到 **"公网 IP"** 字段
4. 复制这个 IP 地址

---

## 📊 验证部署

### 1. 健康检查

访问：`http://你的服务器IP:3000/health`

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2026-05-21T...",
  "uptime": 123.45
}
```

### 2. 登录测试

访问：`http://你的服务器IP:3000`

使用测试账号登录（需要先在数据库中创建用户）

---

## 🛠️ 常用管理命令

在服务器终端中执行：

```bash
# 查看服务状态
cd /opt/bank-customer-ops/skill工厂/外呼话术流程生成/v2
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 更新代码并重新部署
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🌐 绑定域名（可选）

如果你有域名，可以绑定到服务器：

### 1. 域名解析

在你的域名服务商（阿里云/腾讯云）添加 A 记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 你的服务器IP | 600 |
| A | www | 你的服务器IP | 600 |

### 2. 安装 Nginx 反向代理

在服务器终端执行：

```bash
# 安装 Nginx
apt update && apt install nginx -y

# 创建配置文件
cat > /etc/nginx/sites-available/bank-ops << 'EOF'
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
EOF

# 启用配置
ln -s /etc/nginx/sites-available/bank-ops /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 3. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 自动配置 SSL 证书
certbot --nginx -d your-domain.com -d www.your-domain.com
```

配置完成后，访问：`https://your-domain.com`

---

## 🐛 常见问题

### Q1: 部署脚本下载失败

**原因**：GitHub 访问不稳定

**解决**：多试几次，或使用国内镜像：

```bash
curl -fsSL https://ghproxy.com/https://raw.githubusercontent.com/xanqi0203-droid/business-dashboard/main/skill工厂/外呼话术流程生成/v2/deploy.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### Q2: Docker 安装失败

**原因**：网络问题

**解决**：使用阿里云 Docker 镜像源：

```bash
curl -fsSL https://get.docker.com | sh -s docker --mirror Aliyun
```

### Q3: 容器启动失败

**原因**：环境变量配置错误

**解决**：检查 `.env` 文件：

```bash
cd /opt/bank-customer-ops/skill工厂/外呼话术流程生成/v2
cat .env
# 检查每个环境变量是否正确
```

### Q4: 无法访问 http://IP:3000

**原因**：防火墙端口未开放

**解决**：
1. 检查阿里云控制台的防火墙规则
2. 确保 3000 端口已添加并授权 0.0.0.0/0

### Q5: 数据库连接超时

**原因**：Neon 在美东，阿里云在国内，延迟较高

**解决**：
- 首次连接会慢一些（200-500ms）
- 如果持续超时，考虑迁移到阿里云 RDS PostgreSQL

---

## 💰 成本估算

- **轻量应用服务器**：50-60 元/月
- **域名**（可选）：50-100 元/年
- **SSL 证书**：免费（Let's Encrypt）
- **总计**：约 50-60 元/月

---

## 📞 需要帮助？

如果部署过程中遇到问题：

1. 查看详细日志：`docker-compose logs -f`
2. 查看完整文档：[DEPLOY_DOCKER.md](DEPLOY_DOCKER.md)
3. GitHub Issues：https://github.com/xanqi0203-droid/business-dashboard/issues

---

## ✅ 部署检查清单

完成以下步骤后，你就拥有了一个国内可直接访问的银行客户运营系统：

- [ ] 购买阿里云轻量应用服务器
- [ ] 设置服务器密码并重启
- [ ] 配置防火墙开放 3000 端口
- [ ] 通过网页终端远程连接
- [ ] 执行一键部署脚本
- [ ] 配置环境变量
- [ ] 等待部署完成
- [ ] 访问 http://服务器IP:3000 验证
- [ ] 健康检查接口返回正常
- [ ] 登录功能正常
- [ ] （可选）绑定域名
- [ ] （可选）配置 HTTPS

🎉 **恭喜！你的应用已成功部署到阿里云！**
