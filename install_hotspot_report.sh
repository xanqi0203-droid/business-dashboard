#!/bin/bash
# 一键安装脚本：配置飞书日报定时推送（每天早上 7:00）

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_SRC="$PROJECT_DIR/com.hotspot.daily-report.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.hotspot.daily-report.plist"
ENV_FILE="$HOME/.env_dashboard"

echo "════════════════════════════════════════════"
echo "BEAM 热点日报 — 飞书推送安装程序"
echo "════════════════════════════════════════════"

# Step 1: 配置环境变量
if grep -q "FEISHU_WEBHOOK_URL" "$ENV_FILE" 2>/dev/null; then
    echo "✓ 已检测到 FEISHU_WEBHOOK_URL 配置"
else
    echo ""
    echo "请输入飞书群机器人 Webhook URL："
    echo "（在飞书群 → 群设置 → 群机器人 → 添加机器人 → 自定义机器人 中获取）"
    read -r webhook_url

    if [ -z "$webhook_url" ]; then
        echo "ERROR: Webhook URL 不能为空"
        exit 1
    fi

    echo "" >> "$ENV_FILE"
    echo "# 飞书热点日报" >> "$ENV_FILE"
    echo "FEISHU_WEBHOOK_URL=$webhook_url" >> "$ENV_FILE"
    echo "✓ 已写入环境变量文件: $ENV_FILE"
fi

echo ""
echo "请确认数据文件路径（hot-spot 仓库的数据文件）："
echo "当前配置: $PROJECT_DIR/hot-spot/data/hotspot_data.json"
echo "按 Enter 使用默认路径，或输入实际路径："
read -r data_file_path

if [ -n "$data_file_path" ]; then
    # 更新 pipeline 脚本中的数据文件路径
    sed -i '' "s|DATA_FILE=.*|DATA_FILE=\"$data_file_path\"|" \
        "$PROJECT_DIR/Skills/daily-report/scripts/refresh_hotspot_pipeline.sh"
    echo "✓ 已更新数据文件路径"
fi

# Step 2: 安装 LaunchAgent
echo ""
echo "安装 LaunchAgent（每天早上 7:00 触发）..."

# 卸载旧版本
if launchctl list com.hotspot.daily-report 2>/dev/null; then
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

cp "$PLIST_SRC" "$PLIST_DEST"
launchctl load "$PLIST_DEST"

echo "✓ LaunchAgent 已安装并启动"

# Step 3: 立即测试
echo ""
echo "是否立即测试一次推送？(y/N)"
read -r answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
    echo "正在测试推送..."
    launchctl start com.hotspot.daily-report
    sleep 3
    echo ""
    echo "查看日志："
    tail -20 "$PROJECT_DIR/logs/launchagent.log" 2>/dev/null || echo "（日志文件尚未生成，请稍后查看）"
fi

echo ""
echo "════════════════════════════════════════════"
echo "✓ 安装完成！"
echo ""
echo "每天早上 7:00 自动推送到飞书群"
echo ""
echo "常用命令："
echo "  手动触发:  launchctl start com.hotspot.daily-report"
echo "  查看日志:  tail -f $PROJECT_DIR/logs/launchagent.log"
echo "  卸载:      launchctl unload $PLIST_DEST"
echo "════════════════════════════════════════════"
