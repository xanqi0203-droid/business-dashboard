#!/bin/bash
# BEAM — refresh_hotspot_pipeline.sh
# 热点话题每日自动化推送流水线
# 串行执行：数据检查 → KPI 提取 → 飞书推送
#
# 环境变量（从 ~/.env_dashboard 加载）：
#   FEISHU_WEBHOOK_URL - 飞书群机器人 Webhook 地址
#
# 用法：
#   bash refresh_hotspot_pipeline.sh

set -uo pipefail

# ── 配置 ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# 加载环境变量
ENV_FILE="$HOME/.env_dashboard"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "WARN: 环境变量文件 $ENV_FILE 不存在"
fi

# Python 解释器
PYTHON=""
for candidate in \
    "$HOME/.local/bin/python3" \
    "/opt/homebrew/bin/python3" \
    "/usr/local/bin/python3" \
    "/usr/bin/python3"; do
    if [ -x "$candidate" ]; then
        PYTHON="$candidate"
        break
    fi
done
if [ -z "$PYTHON" ]; then
    echo "ERROR: 未找到 Python3 解释器"
    exit 1
fi

# 日志
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run_daily_$(date +%Y-%m-%d).log"

SKILLS_DIR="$PROJECT_DIR/Skills/daily-report/scripts"
TMP_DIR="$PROJECT_DIR/.tmp"
mkdir -p "$TMP_DIR"

# ── 配置项（按项目定制）──────────────────────────────────────────────
# >>> 修改以下变量以适配你的项目 <<<

# 数据文件路径（支持 .json / .csv / .xlsx）
# hot-spot 仓库的数据文件路径，克隆后修改为实际路径
DATA_FILE="$PROJECT_DIR/hot-spot/data/hotspot_data.json"

# ── 工具函数 ──────────────────────────────────────────────────────────

log() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

step() {
    local step_name="$1"
    shift
    log "▶ 开始: $step_name"
    local start=$(date +%s)
    if "$@" >> "$LOG_FILE" 2>&1; then
        local end=$(date +%s)
        log "✓ 完成: $step_name ($(( end - start ))s)"
        return 0
    else
        local code=$?
        local end=$(date +%s)
        log "✗ 失败: $step_name (exit $code, $(( end - start ))s)"
        return $code
    fi
}

# ── 执行流水线 ────────────────────────────────────────────────────────

log "═══════════════════════════════════════════"
log "BEAM 热点话题流水线启动"
log "  项目: $PROJECT_DIR"
log "  数据: $DATA_FILE"
log "═══════════════════════════════════════════"

# Step 1: 拉取最新数据（如果是 git 仓库）
HOTSPOT_DIR="$PROJECT_DIR/hot-spot"
if [ -d "$HOTSPOT_DIR/.git" ]; then
    step "拉取最新数据" git -C "$HOTSPOT_DIR" pull --ff-only || true
fi

# Step 2: 检查数据文件
if [ ! -f "$DATA_FILE" ]; then
    log "ERROR: 数据文件不存在: $DATA_FILE"
    log "请修改 DATA_FILE 变量为实际数据文件路径"
    exit 1
fi

# Step 3: 提取 KPI
if ! step "KPI 提取" "$PYTHON" "$SKILLS_DIR/extract_hotspot_kpis.py" "$DATA_FILE" --output "$TMP_DIR/kpis.json"; then
    log "ABORT: KPI 提取失败，中止流水线"
    exit 1
fi

# Step 4: 发送到飞书
if ! step "飞书推送" "$PYTHON" "$SKILLS_DIR/send_feishu.py" \
    --kpis "$TMP_DIR/kpis.json"; then
    log "ERROR: 飞书推送失败（可手动重试）"
    exit 1
fi

log "═══════════════════════════════════════════"
log "BEAM 流水线完成"
log "═══════════════════════════════════════════"
