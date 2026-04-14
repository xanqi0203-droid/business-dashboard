#!/usr/bin/env python3
"""
BEAM — 飞书 Webhook 推送脚本
通过飞书群机器人 Webhook 发送富文本消息卡片

环境变量：
  FEISHU_WEBHOOK_URL - 飞书群机器人 Webhook 地址

用法：
  python send_feishu.py --kpis kpis.json [--vercel-url URL]
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List
import urllib.request
import urllib.error


def load_kpis(kpis_file: str) -> Dict[str, Any]:
    """加载 KPI JSON 文件"""
    with open(kpis_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def format_number(value: float, is_percentage: bool = False) -> str:
    """格式化数字显示"""
    if is_percentage:
        return f"{value:.1f}%"
    if value >= 10000:
        return f"{value/10000:.1f}万"
    return f"{int(value):,}"


def format_trend(value: float) -> tuple[str, str]:
    """格式化趋势显示，返回 (emoji, 颜色)"""
    if value > 0:
        return "📈", "green"
    elif value < 0:
        return "📉", "red"
    else:
        return "➡️", "grey"


def build_feishu_card(kpis: Dict[str, Any], vercel_url: str = None) -> Dict[str, Any]:
    """构建飞书消息卡片 JSON"""

    today = datetime.now().strftime("%Y年%m月%d日")

    # 卡片头部
    card = {
        "msg_type": "interactive",
        "card": {
            "config": {
                "wide_screen_mode": True
            },
            "header": {
                "title": {
                    "tag": "plain_text",
                    "content": f"🔥 热点话题日报 | {today}"
                },
                "template": "red"
            },
            "elements": []
        }
    }

    elements = card["card"]["elements"]

    # KPI 核心指标区
    kpi_fields = []

    if "total_topics" in kpis:
        trend_emoji, _ = format_trend(kpis.get("topics_growth", 0))
        kpi_fields.append({
            "is_short": True,
            "text": {
                "tag": "lark_md",
                "content": f"**话题总数**\n{format_number(kpis['total_topics'])} {trend_emoji}"
            }
        })

    if "hot_topics" in kpis:
        kpi_fields.append({
            "is_short": True,
            "text": {
                "tag": "lark_md",
                "content": f"**热门话题**\n{format_number(kpis['hot_topics'])} 个"
            }
        })

    if "total_engagement" in kpis:
        trend_emoji, _ = format_trend(kpis.get("engagement_growth", 0))
        kpi_fields.append({
            "is_short": True,
            "text": {
                "tag": "lark_md",
                "content": f"**总互动量**\n{format_number(kpis['total_engagement'])} {trend_emoji}"
            }
        })

    if "avg_heat_score" in kpis:
        kpi_fields.append({
            "is_short": True,
            "text": {
                "tag": "lark_md",
                "content": f"**平均热度**\n{kpis['avg_heat_score']:.1f}"
            }
        })

    if kpi_fields:
        elements.append({
            "tag": "div",
            "fields": kpi_fields
        })
        elements.append({"tag": "hr"})

    # 按分类展示热点话题
    if "topics_by_category" in kpis and kpis["topics_by_category"]:
        category_icons = {
            "AI": "🤖",
            "科技": "💻",
            "银行": "🏦",
            "娱乐": "🎬"
        }

        for category, topics in kpis["topics_by_category"].items():
            if not topics:
                continue

            icon = category_icons.get(category, "📌")
            elements.append({
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**{icon} {category}热点**"
                }
            })

            for i, topic in enumerate(topics[:3], 1):  # 每个分类显示前3条
                topic_name = topic.get("name", "未知话题")
                heat = topic.get("heat_score", 0)
                engagement = topic.get("engagement", 0)
                url = topic.get("url", "")

                # 如果有 URL，使用 Markdown 链接格式
                if url:
                    topic_display = f"[{topic_name}]({url})"
                else:
                    topic_display = topic_name

                elements.append({
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": f"`{i}` **{topic_display}**\n热度: {heat:.0f} | 互动: {format_number(engagement)}"
                    }
                })

        elements.append({"tag": "hr"})

    # 平台分布
    if "platform_distribution" in kpis:
        elements.append({
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": "**📱 平台分布**"
            }
        })

        platform_text = []
        for platform, count in kpis["platform_distribution"].items():
            platform_text.append(f"• {platform}: {format_number(count)}")

        elements.append({
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": "\n".join(platform_text)
            }
        })
        elements.append({"tag": "hr"})

    # 在线看板链接
    if vercel_url:
        elements.append({
            "tag": "action",
            "actions": [{
                "tag": "button",
                "text": {
                    "tag": "plain_text",
                    "content": "📊 查看完整看板"
                },
                "type": "primary",
                "url": vercel_url
            }]
        })

    # 底部时间戳
    elements.append({
        "tag": "note",
        "elements": [{
            "tag": "plain_text",
            "content": f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }]
    })

    return card


def send_to_feishu(webhook_url: str, card: Dict[str, Any]) -> bool:
    """发送消息到飞书"""
    try:
        data = json.dumps(card).encode('utf-8')
        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))

            if result.get("code") == 0:
                print("✓ 飞书消息发送成功")
                return True
            else:
                print(f"✗ 飞书 API 返回错误: {result}", file=sys.stderr)
                return False

    except urllib.error.HTTPError as e:
        print(f"✗ HTTP 错误: {e.code} {e.reason}", file=sys.stderr)
        print(f"  响应: {e.read().decode('utf-8')}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"✗ 发送失败: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="发送热点数据到飞书")
    parser.add_argument("--kpis", required=True, help="KPI JSON 文件路径")
    parser.add_argument("--vercel-url", help="在线看板 URL（可选）")
    args = parser.parse_args()

    # 检查环境变量
    webhook_url = os.getenv("FEISHU_WEBHOOK_URL")
    if not webhook_url:
        print("ERROR: 环境变量 FEISHU_WEBHOOK_URL 未设置", file=sys.stderr)
        sys.exit(1)

    # 加载 KPI
    kpis = load_kpis(args.kpis)

    # 构建消息卡片
    card = build_feishu_card(kpis, args.vercel_url)

    # 发送到飞书
    if send_to_feishu(webhook_url, card):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
