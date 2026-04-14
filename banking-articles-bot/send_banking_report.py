#!/usr/bin/env python3
"""
银行存量客户/长尾客户运营文章搜索 + 飞书推送
使用 Serper.dev (Google Search API) 搜索 36氪/虎嗅/亿欧/钛媒体/雪球/知乎专栏
"""

import json
import os
import sys
import time
import random
import re
from datetime import datetime
from urllib.parse import quote
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET


# ─────────────────────────────────────────────
# 配置
# ─────────────────────────────────────────────
FEISHU_WEBHOOK_URL = os.environ.get('FEISHU_WEBHOOK_URL', '')
SERPER_API_KEY = os.environ.get('SERPER_API_KEY', '')

SEARCH_KEYWORDS = [
    "银行存量客户运营 AUM提升",
    "银行长尾客户激活 案例",
    "银行代发薪客群运营 策略",
    "手机银行促活 方法论",
    "银行客户分层运营 实践",
    "银行存量客户资产提升 路径",
    "银行沉睡客户唤醒 运营",
    "银行私域运营 企业微信",
    "银行客户生命周期管理 实战",
    "银行零售客户精细化运营 案例",
    "银行APP月活提升 策略",
    "银行客户留存 运营体系",
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
}


# ─────────────────────────────────────────────
# Serper.dev Google Search API
# ─────────────────────────────────────────────
def _serper_request(query, count=3):
    """发送单次 Serper 搜索请求，返回原始结果列表"""
    payload = json.dumps({
        'q': query,
        'num': count,
        'hl': 'zh-cn',
        'gl': 'cn',
        'tbs': 'qdr:m',  # 最近一个月
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://google.serper.dev/search',
        data=payload,
        headers={
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json',
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data.get('organic', [])
    except Exception as e:
        print(f"Serper 请求失败 ({query[:30]}): {e}")
        return []


def search_via_serper(keyword):
    """用 Serper 搜索 36氪/虎嗅/亿欧/钛媒体/雪球/知乎专栏，保证来源多样性"""
    if not SERPER_API_KEY:
        return []

    results = []

    sources = [
        ('36kr.com',            '36氪',     2),
        ('huxiu.com',           '虎嗅',     2),
        ('iyiou.com',           '亿欧',     2),
        ('tmtpost.com',         '钛媒体',   2),
        ('sohu.com/a',          '搜狐号',   1),
        ('zhuanlan.zhihu.com',  '知乎专栏', 2),
    ]

    for site, source_name, limit in sources:
        items = _serper_request(f'{keyword} site:{site}', count=limit)
        for item in items[:limit]:
            title = item.get('title', '').strip()
            url = item.get('link', '').strip()
            snippet = item.get('snippet', '').strip()

            if not title or not url:
                continue

            # 内容相关性过滤：标题或摘要必须包含银行运营相关关键词
            text = title + snippet
            relevant_keywords = [
                '银行', '客户运营', '存量', '长尾', 'AUM', '资产',
                '代发薪', '手机银行', '促活', '激活', '留存', '唤醒',
                '私域', '企业微信', '分层', '精细化', '零售'
            ]
            if not any(kw in text for kw in relevant_keywords):
                continue

            results.append({
                'title': title,
                'url': url,
                'summary': snippet,
                'source': source_name,
                'publish_date': item.get('date', datetime.now().strftime('%Y-%m-%d')),
            })
        time.sleep(0.5)

    return results


# ─────────────────────────────────────────────
# RSS 订阅（无需 API Key，作为补充）
# ─────────────────────────────────────────────
RSS_FEEDS = [
    ('36氪', 'https://36kr.com/feed'),
    ('虎嗅', 'https://www.huxiu.com/rss/0.xml'),
]

BANKING_KEYWORDS_FILTER = [
    '存量客户', '长尾客户', '客户运营', '私域运营', '客户激活',
    '客户留存', '客户分层', '精细化运营', '零售银行', '数字化运营',
    '客户经营', '客户价值', '客户触达', '客户唤醒', '银行运营',
]


def fetch_rss(feed_name, feed_url):
    """抓取 RSS 并过滤银行运营相关文章"""
    articles = []
    try:
        req = urllib.request.Request(feed_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')

        root = ET.fromstring(content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        items = root.findall('.//item') or root.findall('.//atom:entry', ns)

        for item in items[:20]:
            title = (item.findtext('title') or item.findtext('atom:title', namespaces=ns) or '').strip()
            link = (item.findtext('link') or item.findtext('atom:link', namespaces=ns) or '').strip()
            desc = (item.findtext('description') or item.findtext('atom:summary', namespaces=ns) or '').strip()
            pub_date = (item.findtext('pubDate') or item.findtext('atom:published', namespaces=ns) or '')[:10]

            text = title + desc
            if not any(kw in text for kw in BANKING_KEYWORDS_FILTER):
                continue

            articles.append({
                'title': title,
                'url': link,
                'summary': re.sub(r'<[^>]+>', '', desc)[:150],
                'source': feed_name,
                'publish_date': pub_date or datetime.now().strftime('%Y-%m-%d'),
            })

    except Exception as e:
        print(f"RSS 抓取失败 ({feed_name}): {e}")

    return articles


# ─────────────────────────────────────────────
# 主搜索逻辑
# ─────────────────────────────────────────────
def collect_articles(target=10):
    """综合多种方式收集文章"""
    articles = []

    # 方式1：Serper 搜索 36氪/虎嗅/亿欧/钛媒体/雪球/知乎专栏
    if SERPER_API_KEY:
        keyword = random.choice(SEARCH_KEYWORDS)
        print(f"Serper 搜索关键词：{keyword}")
        serper_articles = search_via_serper(keyword)
        articles.extend(serper_articles)
        print(f"  → 获取到 {len(serper_articles)} 篇文章")
    else:
        print("未配置 SERPER_API_KEY，跳过 Serper 搜索")

    # 方式2：RSS 订阅补充
    if len(articles) < target:
        print("从 RSS 订阅获取文章...")
        for name, url in RSS_FEEDS:
            results = fetch_rss(name, url)
            articles.extend(results)
            time.sleep(1)

    # 去重
    seen = set()
    unique = []
    for a in articles:
        key = a.get('title', '')
        if key and key not in seen:
            seen.add(key)
            unique.append(a)

    return unique[:target]

# ─────────────────────────────────────────────
# 飞书推送
# ─────────────────────────────────────────────
def build_feishu_card(articles):
    """构建飞书卡片消息"""
    today = datetime.now().strftime('%Y年%m月%d日')
    elements = []

    elements.append({
        'tag': 'div',
        'text': {
            'tag': 'lark_md',
            'content': f'今日为您精选 **{len(articles)}** 篇银行客户运营相关文章，涵盖存量客户运营、长尾客户运营等核心主题。'
        }
    })
    elements.append({'tag': 'hr'})

    for i, article in enumerate(articles, 1):
        title = article.get('title', '（无标题）')
        source = article.get('source', '未知来源')
        url = article.get('url', '')
        summary = article.get('summary', '')

        content_lines = [f'**{i}. {title}**']
        if summary:
            content_lines.append(f'{summary[:120]}...' if len(summary) > 120 else summary)
        meta_parts = [f'📰 {source}']
        if url:
            meta_parts.append(f'[阅读原文]({url})')
        content_lines.append('　'.join(meta_parts))

        elements.append({
            'tag': 'div',
            'text': {
                'tag': 'lark_md',
                'content': '\n'.join(content_lines)
            }
        })

        if i < len(articles):
            elements.append({'tag': 'hr'})

    elements.append({'tag': 'hr'})
    elements.append({
        'tag': 'note',
        'elements': [{
            'tag': 'plain_text',
            'content': f'数据来源：36氪 / 虎嗅 / 亿欧 / 钛媒体 / 雪球 / 知乎专栏 | 每日 09:00 自动推送 | {today}'
        }]
    })

    return {
        'msg_type': 'interactive',
        'card': {
            'header': {
                'title': {
                    'tag': 'plain_text',
                    'content': f'🏦 银行客户运营每日精选 · {today}'
                },
                'template': 'green'
            },
            'elements': elements
        }
    }


def send_to_feishu(articles):
    """发送到飞书"""
    if not FEISHU_WEBHOOK_URL:
        print("❌ 未配置 FEISHU_WEBHOOK_URL，跳过推送")
        return False

    card = build_feishu_card(articles)
    data = json.dumps(card, ensure_ascii=False).encode('utf-8')

    req = urllib.request.Request(
        FEISHU_WEBHOOK_URL,
        data=data,
        headers={'Content-Type': 'application/json; charset=utf-8'},
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            if result.get('code') == 0 or result.get('StatusCode') == 0:
                print('✅ 飞书推送成功')
                return True
            else:
                print(f'❌ 飞书返回错误: {result}')
                return False
    except Exception as e:
        print(f'❌ 飞书推送失败: {e}')
        return False


def send_error_to_feishu(error_msg):
    """发送错误通知"""
    if not FEISHU_WEBHOOK_URL:
        return
    body = {
        'msg_type': 'text',
        'content': {
            'text': f'⚠️ 银行客户运营文章推送失败\n时间：{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n错误：{error_msg}'
        }
    }
    data = json.dumps(body, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(
        FEISHU_WEBHOOK_URL,
        data=data,
        headers={'Content-Type': 'application/json; charset=utf-8'},
        method='POST'
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


# ─────────────────────────────────────────────
# 入口
# ─────────────────────────────────────────────
def main():
    print(f"========== 银行客户运营文章日报 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ==========\n")

    try:
        articles = collect_articles(target=10)
        print(f"\n共收集到 {len(articles)} 篇文章")

        if not articles:
            raise ValueError("未找到任何文章，请检查 SERPER_API_KEY 是否配置正确")

        # 保存到文件（供调试）
        with open('/tmp/banking_articles.json', 'w', encoding='utf-8') as f:
            json.dump({'date': datetime.now().isoformat(), 'articles': articles}, f, ensure_ascii=False, indent=2)

        # 推送到飞书
        success = send_to_feishu(articles)
        sys.exit(0 if success else 1)

    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        send_error_to_feishu(str(e))
        sys.exit(1)


if __name__ == '__main__':
    main()
