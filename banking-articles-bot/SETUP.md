# 银行客户运营文章推送 - 快速配置指南

## 第一步：配置飞书 Webhook（2分钟）

1. 打开飞书，进入你想接收推送的群聊
2. 点击右上角「...」→「设置」→「群机器人」
3. 点击「添加机器人」→「自定义机器人」
4. 机器人名称：`银行客户运营日报`
5. 复制生成的 Webhook URL（类似 `https://open.feishu.cn/open-apis/bot/v2/hook/xxx`）

## 第二步：配置 GitHub Secrets（1分钟）

1. 进入 GitHub 仓库页面
2. 点击「Settings」→「Secrets and variables」→「Actions」
3. 点击「New repository secret」
4. 添加以下 Secret：
   - **Name**: `FEISHU_WEBHOOK_URL`
   - **Secret**: 粘贴刚才复制的飞书 Webhook URL
5. 点击「Add secret」

## 第三步：启用 GitHub Actions（30秒）

1. 进入仓库的「Actions」标签页
2. 如果看到提示，点击「I understand my workflows, go ahead and enable them」
3. 找到「银行客户运营文章每日推送」workflow
4. 点击「Enable workflow」

## 第四步：测试推送（30秒）

1. 在「Actions」页面，点击「银行客户运营文章每日推送」
2. 点击右侧「Run workflow」→「Run workflow」
3. 等待 30 秒，查看飞书群是否收到推送

✅ 如果收到推送，配置完成！每天早上 9:00 会自动推送。

---

## 可选配置：Bing Search API（获取实时文章）

如果想搜索最新的微信公众号、知乎文章，可以配置 Bing API：

1. 访问 [Azure Portal](https://portal.azure.com/)
2. 搜索「Bing Search v7」→ 创建资源
3. 选择「F1 免费层」（每月 1000 次免费调用）
4. 创建后，复制「Keys and Endpoint」中的 Key1
5. 在 GitHub Secrets 中添加：
   - **Name**: `BING_SEARCH_API_KEY`
   - **Secret**: 粘贴 API Key

---

## 修改推送时间

编辑 `.github/workflows/banking-articles-daily.yml`：

```yaml
schedule:
  - cron: '0 1 * * *'  # 北京时间 09:00
```

常用时间对照：
- `0 0 * * *` = 北京时间 08:00
- `0 1 * * *` = 北京时间 09:00
- `0 2 * * *` = 北京时间 10:00
- `30 1 * * *` = 北京时间 09:30

---

## 故障排查

### 问题：没有收到推送
1. 检查 Actions 运行日志是否有错误
2. 确认 `FEISHU_WEBHOOK_URL` 配置正确
3. 测试 Webhook 是否有效：
   ```bash
   curl -X POST "你的webhook地址" \
     -H "Content-Type: application/json" \
     -d '{"msg_type":"text","content":{"text":"测试消息"}}'
   ```

### 问题：Actions 没有自动运行
1. 确认 Workflow 已启用
2. 检查仓库是否有最近的 commit（GitHub 会暂停长期无活动的 Actions）

### 问题：文章质量不高
1. 配置 Bing Search API 获取实时文章
2. 修改 `send_banking_report.py` 中的 `SEARCH_KEYWORDS` 和 `BANKING_KEYWORDS_FILTER`

---

## 联系支持

如有问题，请在 GitHub Issues 中反馈。
