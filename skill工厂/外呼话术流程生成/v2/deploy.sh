#!/bin/bash

# 银行客户运营系统 - Docker 一键部署脚本
# 适用于 Ubuntu 22.04 / CentOS 8

set -e

echo "=========================================="
echo "  银行客户运营系统 - Docker 一键部署"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}✗ 无法检测操作系统${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 检测到操作系统: $OS${NC}"
echo ""

# 步骤 1: 安装 Docker
echo "=========================================="
echo "步骤 1/5: 安装 Docker"
echo "=========================================="

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker 已安装${NC}"
    docker --version
else
    echo "正在安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
fi
echo ""

# 步骤 2: 安装 Docker Compose
echo "=========================================="
echo "步骤 2/5: 安装 Docker Compose"
echo "=========================================="

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
    docker-compose --version
else
    echo "正在安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
fi
echo ""

# 步骤 3: 安装 Git
echo "=========================================="
echo "步骤 3/5: 安装 Git"
echo "=========================================="

if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ Git 已安装${NC}"
else
    echo "正在安装 Git..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt update && apt install git -y
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install git -y
    fi
    echo -e "${GREEN}✓ Git 安装完成${NC}"
fi
echo ""

# 步骤 4: 克隆代码
echo "=========================================="
echo "步骤 4/5: 克隆代码"
echo "=========================================="

DEPLOY_DIR="/opt/bank-customer-ops"

if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}⚠ 目录已存在，正在更新代码...${NC}"
    cd "$DEPLOY_DIR"
    git pull
else
    echo "正在克隆代码..."
    git clone https://github.com/xanqi0203-droid/business-dashboard.git "$DEPLOY_DIR"
    cd "$DEPLOY_DIR/skill工厂/外呼话术流程生成/v2"
fi

cd "$DEPLOY_DIR/skill工厂/外呼话术流程生成/v2"
echo -e "${GREEN}✓ 代码准备完成${NC}"
echo ""

# 步骤 5: 配置环境变量
echo "=========================================="
echo "步骤 5/5: 配置环境变量"
echo "=========================================="

if [ -f .env ]; then
    echo -e "${YELLOW}⚠ .env 文件已存在，是否覆盖？(y/n)${NC}"
    read -r OVERWRITE
    if [ "$OVERWRITE" != "y" ]; then
        echo "跳过环境变量配置"
    else
        rm .env
    fi
fi

if [ ! -f .env ]; then
    echo "请输入以下环境变量（按回车使用默认值）："
    echo ""

    read -p "DATABASE_URL (Neon PostgreSQL 连接串): " DATABASE_URL
    read -p "JWT_SECRET (至少32位随机字符串): " JWT_SECRET
    read -p "LLM_BASE_URL [https://one.iflytek.com/api/llm/console/chat]: " LLM_BASE_URL
    LLM_BASE_URL=${LLM_BASE_URL:-https://one.iflytek.com/api/llm/console/chat}
    read -p "LLM_API_KEY (讯飞 API Key): " LLM_API_KEY
    read -p "LLM_MODEL [claude-sonnet-4-6-20250514]: " LLM_MODEL
    LLM_MODEL=${LLM_MODEL:-claude-sonnet-4-6-20250514}

    echo ""
    echo "可选配置（直接回车跳过）："
    read -p "BLOB_READ_WRITE_TOKEN (Vercel Blob，文件上传用): " BLOB_READ_WRITE_TOKEN
    read -p "OPENAI_API_KEY (向量搜索用，不配置会降级到本地): " OPENAI_API_KEY

    # 生成 .env 文件
    cat > .env << EOF
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
LLM_BASE_URL=$LLM_BASE_URL
LLM_API_KEY=$LLM_API_KEY
LLM_MODEL=$LLM_MODEL
BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN
OPENAI_API_KEY=$OPENAI_API_KEY
EOF

    echo -e "${GREEN}✓ 环境变量配置完成${NC}"
fi
echo ""

# 步骤 6: 构建并启动
echo "=========================================="
echo "正在构建并启动应用..."
echo "=========================================="

docker-compose down 2>/dev/null || true
docker-compose build
docker-compose up -d

echo ""
echo "等待服务启动..."
sleep 5

# 健康检查
echo "正在进行健康检查..."
for i in {1..10}; do
    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✓ 服务启动成功！${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}✗ 服务启动失败，请查看日志：docker-compose logs${NC}"
        exit 1
    fi
    sleep 2
done

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")

echo ""
echo "=========================================="
echo -e "${GREEN}✅ 部署成功！${NC}"
echo "=========================================="
echo ""
echo "🌐 访问地址："
echo "   http://$SERVER_IP:3000"
echo ""
echo "📊 健康检查："
echo "   http://$SERVER_IP:3000/health"
echo ""
echo "📝 常用命令："
echo "   查看日志: docker-compose logs -f"
echo "   重启服务: docker-compose restart"
echo "   停止服务: docker-compose stop"
echo "   更新代码: cd $DEPLOY_DIR/skill工厂/外呼话术流程生成/v2 && git pull && docker-compose down && docker-compose build && docker-compose up -d"
echo ""
echo "=========================================="
