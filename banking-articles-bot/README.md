# 银行客户运营文章每日推送

每天早上 9:00 自动搜索银行存量客户运营和长尾客户运营相关文章，并推送到飞书。

## 功能特点

- 🔍 **多源搜索**：支持 Bing Search API、RSS 订阅、精选文章库
- 📊 **智能筛选**：自动过滤银行客户运营相关内容
- 📱 **飞书推送**：每天 9:00 自动推送 10 篇精选文章
- 🎯 **关键词覆盖**：存量客户、长尾客户、精细化运营、私域运营等

## 快速开始

### 1. 配置飞书 Webhook（必需）

1. 在飞书群聊中添加「自定义机器人」
2. 复制 Webhook URL
3. 在 GitHub 仓库设置中添加 Secret：
   - 名称：`FEISHU_WEBHOOK_URL`
   - 值：你的飞书 Webhook URL

### 2. 配置 Bing Search API（可选，推荐）

如果需要实时搜索最新文章：

1. 注册 [Azure Bing Search API](https://portal.azure.com/)（免费额度：每月 1000 次）
2. 获取 API Key
3. 在 GitHub 仓库设置中添加 Secret：
   - 名称：`BING_SEARCH_API_KEY`
   - 值：你的 Bing API Key

> 💡 **不配置 Bing API 也能正常运行**，会使用 RSS 订阅 + 精选文章库

### 3. 启用 GitHub Actions

1. 进入仓库的 **Actions** 标签页
2. 启用 Workflows
3. 找到「银行客户运营文章每日推送」
4. 点击「Enable workflow」

## 手动测试

点击 Actions → 银行客户运营文章每日推送 → Run workflow，立即测试推送效果。

## 推送时间

- **默认时间**：每天北京时间 09:00
- **修改方法**：编辑 [.github/workflows/banking-articles-daily.yml](.github/workflows/banking-articles-daily.yml)
  ```yaml
  schedule:
    - cron: '0 1 * * *'  # UTC 01:00 = 北京时间 09:00
  ```

## 推送内容示例

```
📚 银行客户运营每日精选 · 2026年4月14日

共推荐 10 篇文章 | 关键词：存量客户运营 / 长尾客户运营 / 精细化运营

━━━━━━━━━━━━━━━━━━━━

1. 银行存量客户运营：从"守株待兔"到"主动出击"
   来源：银行家杂志
   摘要：存量客户是银行最重要的资产，如何通过数据驱动实现精准触达...
   🔗 查看原文

2. 长尾客户运营的三大核心策略：分层、激活、留存
   来源：金融科技研究
   摘要：长尾客户占银行客户总量的80%以上，但贡献收益不足20%...
   🔗 查看原文

...
```

## 文件说明

```
banking-articles-bot/
├── send_banking_report.py    # 主脚本：搜索 + 推送
└── search_articles.py         # 旧版搜索脚本（已废弃）

.github/workflows/
└── banking-articles-daily.yml # GitHub Actions 定时任务
```

## 搜索策略

### 优先级 1：Bing Search API（需配置）
- 实时搜索微信公众号、知乎、36氪等平台
- 每月免费 1000 次调用
- 搜索关键词：存量客户运营、长尾客户运营、精细化运营等

### 优先级 2：RSS 订阅（无需配置）
- 36氪、虎嗅、雪球等金融科技媒体
- 自动过滤银行客户运营相关文章

### 优先级 3：精选文章库（兜底）
- 内置 10+ 篇高质量文章
- 确保每天都有内容推送

## 常见问题

### Q: 为什么没有收到推送？
1. 检查飞书 Webhook URL 是否正确配置
2. 查看 GitHub Actions 运行日志
3. 确认 Workflow 已启用

### Q: 如何修改推送时间？
编辑 `.github/workflows/banking-articles-daily.yml` 中的 cron 表达式：
- `0 1 * * *` = 北京时间 09:00
- `0 0 * * *` = 北京时间 08:00
- `30 1 * * *` = 北京时间 09:30

### Q: 如何增加搜索关键词？
编辑 `banking-articles-bot/send_banking_report.py`，修改 `SEARCH_KEYWORDS` 列表。

### Q: 文章质量不高怎么办？
1. 配置 Bing Search API 获取实时文章
2. 修改 `BANKING_KEYWORDS_FILTER` 调整过滤规则
3. 在 `CURATED_ARTICLES` 中添加更多精选文章

## 技术架构

- **运行环境**：GitHub Actions (Ubuntu)
- **编程语言**：Python 3.11
- **依赖库**：标准库（无需额外安装）
- **推送方式**：飞书 Webhook API

## 许可证

MIT License

---

💡 **提示**：首次运行建议手动触发测试，确认推送正常后再依赖定时任务。
