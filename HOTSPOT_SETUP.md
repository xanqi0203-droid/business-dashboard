# BEAM 热点话题日报 — 飞书自动推送

每天早上 7:00 自动从 [Irissunsun/hot-spot](https://github.com/Irissunsun/hot-spot) 仓库提取热点数据，生成 KPI 摘要并推送到飞书群。

## 快速开始

### 1. 获取飞书 Webhook URL

1. 打开飞书群 → 群设置 → 群机器人
2. 添加机器人 → 自定义机器人
3. 设置机器人名称（如"热点日报"）和描述
4. 复制生成的 Webhook 地址（格式：`https://open.feishu.cn/open-apis/bot/v2/hook/...`）

### 2. 克隆 hot-spot 数据仓库

```bash
cd /Users/anqi/Desktop/cc-test
git clone https://github.com/Irissunsun/hot-spot.git
```

### 3. 运行安装脚本

```bash
cd /Users/anqi/Desktop/cc-test
bash install_hotspot_report.sh
```

安装脚本会：
- 引导你配置飞书 Webhook URL
- 确认数据文件路径
- 安装 LaunchAgent（每天 7:00 触发）
- 可选：立即测试一次推送

## 文件结构

```
cc-test/
├── Skills/daily-report/scripts/
│   ├── extract_hotspot_kpis.py      # KPI 提取脚本
│   ├── send_feishu.py               # 飞书推送脚本
│   └── refresh_hotspot_pipeline.sh  # 自动化流水线
├── hot-spot/                        # 数据仓库（需手动克隆）
│   └── data/
│       └── hotspot_data.json        # 热点数据文件
├── logs/                            # 执行日志
├── .tmp/                            # 临时文件（KPI JSON）
├── com.hotspot.daily-report.plist   # LaunchAgent 配置
└── install_hotspot_report.sh        # 一键安装脚本
```

## 数据格式要求

支持 JSON / CSV / Excel 格式，需包含以下字段（字段名不区分大小写）：

| 字段类型 | 可能的字段名 |
|---------|-------------|
| 话题名称 | `topic`, `title`, `name`, `话题`, `标题` |
| 热度分数 | `heat`, `score`, `hot`, `热度`, `分数` |
| 互动量 | `engagement`, `interaction`, `互动`, `评论`, `点赞` |
| 平台 | `platform`, `source`, `来源`, `平台` |

### JSON 示例

```json
[
  {
    "topic": "AI 技术突破",
    "heat_score": 9850,
    "engagement": 125000,
    "platform": "微博"
  },
  {
    "topic": "新能源汽车",
    "heat_score": 8200,
    "engagement": 98000,
    "platform": "抖音"
  }
]
```

### CSV 示例

```csv
话题,热度,互动量,平台
AI 技术突破,9850,125000,微博
新能源汽车,8200,98000,抖音
```

## 定制化配置

### 修改数据文件路径

编辑 [refresh_hotspot_pipeline.sh](Skills/daily-report/scripts/refresh_hotspot_pipeline.sh:60)：

```bash
DATA_FILE="$PROJECT_DIR/hot-spot/data/hotspot_data.json"
```

### 修改推送时间

编辑 [com.hotspot.daily-report.plist](com.hotspot.daily-report.plist:19-22)：

```xml
<key>Hour</key>
<integer>7</integer>  <!-- 修改为目标小时 -->
<key>Minute</key>
<integer>0</integer>  <!-- 修改为目标分钟 -->
```

重新加载配置：

```bash
launchctl unload ~/Library/LaunchAgents/com.hotspot.daily-report.plist
launchctl load ~/Library/LaunchAgents/com.hotspot.daily-report.plist
```

### 调整热门话题阈值

编辑 [extract_hotspot_kpis.py](Skills/daily-report/scripts/extract_hotspot_kpis.py:115)：

```python
hot_threshold = 1000  # 热度 >= 1000 视为热门话题
```

### 自定义字段映射

如果数据文件的字段名不在默认列表中，编辑 [extract_hotspot_kpis.py](Skills/daily-report/scripts/extract_hotspot_kpis.py:103-110)：

```python
topic = {
    "name": normalize_field(record, ["你的字段名", "topic", "title"], "未知话题"),
    "heat_score": normalize_field(record, ["你的热度字段", "heat"], 0),
    # ...
}
```

## 常用命令

```bash
# 手动触发一次推送（不等到定时时间）
launchctl start com.hotspot.daily-report

# 查看实时日志
tail -f /Users/anqi/Desktop/cc-test/logs/launchagent.log

# 查看今天的执行日志
cat /Users/anqi/Desktop/cc-test/logs/run_daily_$(date +%Y-%m-%d).log

# 检查 LaunchAgent 状态
launchctl list | grep hotspot

# 卸载定时任务
launchctl unload ~/Library/LaunchAgents/com.hotspot.daily-report.plist
rm ~/Library/LaunchAgents/com.hotspot.daily-report.plist
```

## 飞书消息卡片预览

推送的消息包含：

- **核心 KPI**：话题总数、热门话题数、总互动量、平均热度
- **Top 5 热门话题**：话题名称、热度分数、互动量
- **平台分布**：各平台话题数量统计
- **在线看板链接**（可选，需配置 Vercel 部署）

## 故障排查

### 推送失败

1. 检查 Webhook URL 是否正确：
   ```bash
   cat ~/.env_dashboard | grep FEISHU_WEBHOOK_URL
   ```

2. 手动测试推送：
   ```bash
   cd /Users/anqi/Desktop/cc-test
   python3 Skills/daily-report/scripts/send_feishu.py \
     --kpis .tmp/kpis.json
   ```

### 数据文件找不到

1. 确认 hot-spot 仓库已克隆
2. 检查数据文件路径是否正确
3. 查看日志：`tail -20 logs/launchagent.log`

### KPI 提取失败

1. 检查数据文件格式是否正确
2. 手动测试提取：
   ```bash
   python3 Skills/daily-report/scripts/extract_hotspot_kpis.py \
     hot-spot/data/hotspot_data.json \
     --output .tmp/kpis.json
   ```

### LaunchAgent 未触发

1. 检查是否已加载：
   ```bash
   launchctl list | grep hotspot
   ```

2. 查看系统日志：
   ```bash
   log show --predicate 'subsystem == "com.apple.launchd"' --last 1h | grep hotspot
   ```

## 环境要求

- macOS（使用 LaunchAgent）
- Python 3.7+
- 依赖库：
  - `openpyxl`（处理 Excel 文件）

安装依赖：

```bash
pip3 install openpyxl
```

## 扩展功能

### 添加 Vercel 在线看板

如果你已有 LENS 生成的看板 HTML，可以部署到 Vercel 并在飞书消息中添加链接：

1. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 在 [refresh_hotspot_pipeline.sh](Skills/daily-report/scripts/refresh_hotspot_pipeline.sh) 中取消注释部署步骤

3. 配置环境变量：
   ```bash
   echo "VERCEL_TOKEN=your_token" >> ~/.env_dashboard
   ```

### 增长率计算

当前增长率为 0，需要历史数据对比。实现方式：

1. 每次执行后保存 KPI 到 `logs/kpis_history/$(date +%Y-%m-%d).json`
2. 在 [extract_hotspot_kpis.py](Skills/daily-report/scripts/extract_hotspot_kpis.py) 中读取昨天的 KPI 文件
3. 计算增长率：`(今天 - 昨天) / 昨天 * 100`

## 技术架构

基于 BEAM 框架（Build → Emit → Automate → Monitor）：

- **Build**：`extract_hotspot_kpis.py` 提取 KPI，`send_feishu.py` 构建消息卡片
- **Emit**：通过飞书 Webhook API 发送
- **Automate**：macOS LaunchAgent 定时触发
- **Monitor**：日志记录到 `logs/` 目录

## 许可

基于 BEAM 技能框架，适配热点话题场景。
