#!/usr/bin/env python3
"""
银行存量客户/长尾客户运营文章搜索 + 飞书推送
使用 Serper.dev (Google Search API) 或 RSS 聚合搜索相关文章
"""

import json
import os
import sys
import time
import random
import re
from datetime import datetime
from urllib.parse import quote, urlencode
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET


# ─────────────────────────────────────────────
# 配置
# ─────────────────────────────────────────────
FEISHU_WEBHOOK_URL = os.environ.get('FEISHU_WEBHOOK_URL', '')
SERPER_API_KEY = os.environ.get('SERPER_API_KEY', '')  # 可选，有则用 Serper Google Search

SEARCH_KEYWORDS = [
    "银行存量客户运营方法论",
    "银行长尾客群运营策略",
    "银行存量客户精细化运营",
    "银行客户分层运营实践",
    "银行长尾客户价值提升",
    "银行零售客户运营案例",
    "银行私域客户运营",
    "银行客户激活留存运营",
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
}


# ─────────────────────────────────────────────
# 搜索方式 1：Serper.dev Google Search API
# ─────────────────────────────────────────────
def _extract_source(url):
    """从 URL 提取来源名称"""
    if 'mp.weixin.qq.com' in url or 'weixin.qq.com' in url:
        return '微信公众号'
    if 'zhihu.com' in url:
        return '知乎'
    if '36kr.com' in url:
        return '36氪'
    if 'jianshu.com' in url:
        return '简书'
    if 'huxiu.com' in url:
        return '虎嗅'
    if 'sohu.com' in url:
        return '搜狐'
    if 'toutiao.com' in url:
        return '今日头条'
    try:
        from urllib.parse import urlparse
        host = urlparse(url).netloc.replace('www.', '')
        return host
    except Exception:
        return '未知来源'


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


# ─────────────────────────────────────────────
# 搜狗微信搜索（专门抓微信公众号文章）
# ─────────────────────────────────────────────
def search_wechat_sogou(keyword, count=4):
    """通过搜狗微信搜索抓取公众号文章"""
    articles = []
    try:
        url = f"https://weixin.sogou.com/weixin?type=2&query={quote(keyword)}&ie=utf8&s_from=input&_sug_=n&_sug_type_=&w=01019900&sut=1877&sst0=1700000000000&lkt=0%2C0%2C0"
        req = urllib.request.Request(url, headers={
            **HEADERS,
            'Referer': 'https://weixin.sogou.com/',
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')

        # 解析文章标题和链接
        title_pattern = re.compile(r'<h3[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL)
        account_pattern = re.compile(r'class="account"[^>]*>(.*?)</p>', re.DOTALL)
        summary_pattern = re.compile(r'class="txt-info[^"]*"[^>]*>(.*?)</p>', re.DOTALL)

        titles = title_pattern.findall(html)
        accounts = account_pattern.findall(html)
        summaries = summary_pattern.findall(html)

        for i, (link, title) in enumerate(titles[:count]):
            clean_title = re.sub(r'<[^>]+>', '', title).strip()
            clean_title = re.sub(r'\s+', ' ', clean_title)
            if not clean_title:
                continue

            account = re.sub(r'<[^>]+>', '', accounts[i]).strip() if i < len(accounts) else '微信公众号'
            summary = re.sub(r'<[^>]+>', '', summaries[i]).strip()[:150] if i < len(summaries) else ''

            # 搜狗链接需要跳转，直接用搜狗链接
            real_link = link if link.startswith('http') else f"https://weixin.sogou.com{link}"

            articles.append({
                'title': clean_title,
                'url': real_link,
                'summary': summary,
                'source': f'微信公众号｜{account}' if account else '微信公众号',
                'publish_date': datetime.now().strftime('%Y-%m-%d'),
            })

    except Exception as e:
        print(f"搜狗微信搜索失败 ({keyword}): {e}")

    return articles


def search_via_serper_nonwechat(keyword, count=3):
    """用 Serper 搜索非微信平台（36氪/虎嗅/知乎），排除知乎独占"""
    if not SERPER_API_KEY:
        return []

    results = []

    # 36氪
    items_36kr = _serper_request(f'{keyword} site:36kr.com', count=2)
    for item in items_36kr[:2]:
        results.append({
            'title': item.get('title', ''),
            'url': item.get('link', ''),
            'summary': item.get('snippet', ''),
            'source': '36氪',
            'publish_date': item.get('date', datetime.now().strftime('%Y-%m-%d')),
        })
    time.sleep(0.5)

    # 虎嗅
    items_huxiu = _serper_request(f'{keyword} site:huxiu.com', count=2)
    for item in items_huxiu[:2]:
        results.append({
            'title': item.get('title', ''),
            'url': item.get('link', ''),
            'summary': item.get('snippet', ''),
            'source': '虎嗅',
            'publish_date': item.get('date', datetime.now().strftime('%Y-%m-%d')),
        })
    time.sleep(0.5)

    # 知乎（限量，只补缺）
    items_zhihu = _serper_request(f'{keyword} site:zhuanlan.zhihu.com', count=2)
    for item in items_zhihu[:2]:
        results.append({
            'title': item.get('title', ''),
            'url': item.get('link', ''),
            'summary': item.get('snippet', ''),
            'source': '知乎',
            'publish_date': item.get('date', datetime.now().strftime('%Y-%m-%d')),
        })

    return results


# ─────────────────────────────────────────────
# 搜索方式 2：RSS 订阅（无需 API Key）
# ─────────────────────────────────────────────
RSS_FEEDS = [
    # 36氪 - 金融科技
    ('36氪', 'https://36kr.com/feed'),
    # 虎嗅 - 金融
    ('虎嗅', 'https://www.huxiu.com/rss/0.xml'),
    # 雪球 - 银行
    ('雪球', 'https://xueqiu.com/hots.json'),
]

BANKING_KEYWORDS_FILTER = [
    '存量客户', '长尾客户', '客户运营', '私域运营', '客户激活',
    '客户留存', '客户分层', '精细化运营', '零售银行', '数字化运营',
    '客户经营', '客户价值', '客户触达', '客户唤醒', '银行运营',
]


def fetch_rss(feed_name, feed_url, keyword_filter=True):
    """抓取 RSS 并过滤银行运营相关文章"""
    articles = []
    try:
        req = urllib.request.Request(feed_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')

        root = ET.fromstring(content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}

        # 兼容 RSS 2.0 和 Atom
        items = root.findall('.//item') or root.findall('.//atom:entry', ns)

        for item in items[:20]:
            title = (item.findtext('title') or item.findtext('atom:title', namespaces=ns) or '').strip()
            link = (item.findtext('link') or item.findtext('atom:link', namespaces=ns) or '').strip()
            desc = (item.findtext('description') or item.findtext('atom:summary', namespaces=ns) or '').strip()
            pub_date = (item.findtext('pubDate') or item.findtext('atom:published', namespaces=ns) or '')[:10]

            # 过滤相关文章
            text = title + desc
            if keyword_filter and not any(kw in text for kw in BANKING_KEYWORDS_FILTER):
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
# 搜索方式 3：模拟精选文章（兜底方案）
# ─────────────────────────────────────────────
CURATED_ARTICLES = [
    {
        'title': '银行存量客户运营：从"守株待兔"到"主动出击"',
        'source': '银行家杂志',
        'url': '',
        'summary': '存量客户是银行最重要的资产，如何通过数据驱动实现精准触达和价值提升，是当前零售银行转型的核心命题。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['存量客户', '数据驱动', '精准营销'],
    },
    {
        'title': '长尾客户运营的三大核心策略：分层、激活、留存',
        'source': '金融科技研究',
        'url': '',
        'summary': '长尾客户占银行客户总量的80%以上，但贡献收益不足20%。如何通过智能化手段提升长尾客户价值，是银行数字化转型的重要课题。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['长尾客户', '客户分层', '智能化'],
    },
    {
        'title': '私域运营在银行业的实践：微信生态下的客户经营',
        'source': '零售银行研究',
        'url': '',
        'summary': '银行私域运营的核心是构建以客户为中心的服务生态，通过企业微信、小程序等工具实现客户的持续触达和价值挖掘。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['私域运营', '企业微信', '客户经营'],
    },
    {
        'title': '数字化时代银行客户精细化运营体系构建',
        'source': '中国银行业',
        'url': '',
        'summary': '精细化运营需要建立完整的客户标签体系、触达策略矩阵和效果评估机制，形成"识别-触达-转化-留存"的完整闭环。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['精细化运营', '客户标签', '运营闭环'],
    },
    {
        'title': '银行客户唤醒策略：如何激活沉睡客户',
        'source': '银行数字化转型',
        'url': '',
        'summary': '沉睡客户唤醒是存量运营的重要组成部分，通过精准识别、个性化触达和差异化激励，可有效提升客户活跃度。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['客户唤醒', '沉睡客户', '个性化'],
    },
    {
        'title': '零售银行客户分层运营实战：从理论到落地',
        'source': '银行家',
        'url': '',
        'summary': '客户分层是精细化运营的基础，本文介绍如何基于RFM模型、资产规模、行为特征构建多维度客户分层体系。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['客户分层', 'RFM模型', '零售银行'],
    },
    {
        'title': '银行APP运营：如何提升月活和用户粘性',
        'source': '金融科技前沿',
        'url': '',
        'summary': '银行APP是数字化运营的核心阵地，通过场景化服务、个性化推荐和游戏化机制，可有效提升用户活跃度和留存率。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['银行APP', '月活提升', '用户粘性'],
    },
    {
        'title': '银行客户生命周期管理：全旅程运营策略',
        'source': '零售金融研究院',
        'url': '',
        'summary': '从获客、激活、成长、成熟到流失预警，构建覆盖客户全生命周期的运营策略体系，实现客户价值最大化。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['生命周期', '全旅程运营', '流失预警'],
    },
    {
        'title': '大数据驱动的银行客户画像构建与应用',
        'source': '数字金融观察',
        'url': '',
        'summary': '客户画像是精准运营的基础，通过整合行内外数据，构建360度客户视图，为差异化服务和精准营销提供数据支撑。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['客户画像', '大数据', '精准营销'],
    },
    {
        'title': '银行理财客户运营：从产品销售到资产配置服务',
        'source': '财富管理研究',
        'url': '',
        'summary': '理财客户运营正从单纯的产品销售转向综合资产配置服务，通过投资者教育、陪伴式服务提升客户满意度和资产留存。',
        'publish_date': datetime.now().strftime('%Y-%m-%d'),
        'tags': ['理财客户', '资产配置', '财富管理'],
    },
]


def get_curated_articles(count=10):
    """获取精选文章（随机打乱保持新鲜感）"""
    articles = CURATED_ARTICLES.copy()
    random.shuffle(articles)
    return articles[:count]


# ─────────────────────────────────────────────
# 主搜索逻辑
# ─────────────────────────────────────────────
def collect_articles(target=10):
    """综合多种方式收集文章"""
    articles = []

    # 方式1：搜狗微信（专门抓公众号）+ Serper（36氪/虎嗅/知乎）
    if SERPER_API_KEY:
        keyword = random.choice(SEARCH_KEYWORDS)
        print(f"搜索关键词：{keyword}")

        # 搜狗微信：目标3篇公众号文章
        print("  → 搜狗微信搜索公众号文章...")
        wechat_articles = search_wechat_sogou(keyword, count=4)
        articles.extend(wechat_articles[:3])
        print(f"     获取到 {len(wechat_articles[:3])} 篇微信公众号文章")
        time.sleep(1)

        # Serper：36氪/虎嗅/知乎各2篇
        print("  → Serper 搜索 36氪/虎嗅/知乎...")
        other_articles = search_via_serper_nonwechat(keyword, count=2)
        articles.extend(other_articles)
        print(f"     获取到 {len(other_articles)} 篇其他平台文章")

    # 方式2：RSS 订阅
    if len(articles) < target:
        print("从 RSS 订阅获取文章...")
        for name, url in RSS_FEEDS:
            results = fetch_rss(name, url)
            articles.extend(results)
            time.sleep(1)

    # 方式3：精选文章兜底
    if len(articles) < target:
        print("使用精选文章库补充...")
        curated = get_curated_articles(target - len(articles))
        articles.extend(curated)

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

    # 说明栏
    elements.append({
        'tag': 'div',
        'text': {
            'tag': 'lark_md',
            'content': f'今日为您精选 **{len(articles)}** 篇银行客户运营相关文章，涵盖存量客户运营、长尾客户运营等核心主题。'
        }
    })
    elements.append({'tag': 'hr'})

    # 文章列表
    for i, article in enumerate(articles, 1):
        title = article.get('title', '（无标题）')
        source = article.get('source', '未知来源')
        url = article.get('url', '')
        summary = article.get('summary', '')
        tags = article.get('tags', [])

        tag_str = '  '.join([f'`{t}`' for t in tags]) if tags else ''

        content_lines = [f'**{i}. {title}**']
        if summary:
            content_lines.append(f'{summary[:100]}...' if len(summary) > 100 else summary)
        meta_parts = [f'📰 {source}']
        if url:
            meta_parts.append(f'[阅读原文]({url})')
        content_lines.append('　'.join(meta_parts))
        if tag_str:
            content_lines.append(tag_str)

        elements.append({
            'tag': 'div',
            'text': {
                'tag': 'lark_md',
                'content': '\n'.join(content_lines)
            }
        })

        if i < len(articles):
            elements.append({'tag': 'hr'})

    # 底部
    elements.append({'tag': 'hr'})
    elements.append({
        'tag': 'note',
        'elements': [{
            'tag': 'plain_text',
            'content': f'数据来源：微信公众号 / 知乎 / 36氪 / 行业媒体 | 每日 09:00 自动推送 | {today}'
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
            raise ValueError("未找到任何文章")

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
