import { requireAuth } from '../_lib/auth.js';
import { callClaude } from '../_lib/claude.js';

const BUSINESS_LABEL = {
  mobile: '手机银行促活',
  asset: '资产提升',
  payment: '快捷支付',
  digital: '数字人民币',
  loan: '贷款营销',
  card: '信用卡',
  wealth: '理财营销'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  const { business, selectedTags = [], candidates = [] } = req.body || {};

  if (!business || !BUSINESS_LABEL[business]) {
    return res.status(400).json({ error: '请选择有效的外呼业务场景' });
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: '候选规则列表不能为空' });
  }

  const businessLabel = BUSINESS_LABEL[business];

  const systemPrompt = `你是银行存量客户外呼运营专家。请根据用户选择的外呼业务场景和已选客群条件，从候选客筛规则中推荐最优 3 条。

排序原则：
1. 综合得分 = 接通率 × 0.4 + 意向率 × 0.6
2. 优先推荐与已选标签互补的规则
3. 避免推荐重复或高度相似的规则

输出严格 JSON 格式：
{
  "recommendations": [
    { "id": 1, "reason": "推荐理由（30字内）" },
    { "id": 2, "reason": "..." },
    { "id": 3, "reason": "..." }
  ]
}

只返回 JSON，不要其他文字。`;

  const candidatesText = candidates
    .map(r => `[${r.id}] ${r.group} | ${r.rule} | 接通率${r.connRate}% | 意向率${r.intentRate}%`)
    .join('\n');

  const userPrompt = `业务场景：${businessLabel}
已选标签：${selectedTags.length > 0 ? selectedTags.join('、') : '无'}

候选规则（${candidates.length} 条）：
${candidatesText}

请推荐最优 3 条。`;

  try {
    const result = await callClaude(systemPrompt, userPrompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: '推荐结果解析失败' });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const recIds = (parsed.recommendations || []).map(r => r.id);
    const reasonMap = Object.fromEntries(
      (parsed.recommendations || []).map(r => [r.id, r.reason])
    );

    // Merge full rule details with LLM reasons
    const recommendations = recIds
      .map(id => {
        const rule = candidates.find(c => c.id === id);
        if (!rule) return null;
        return { ...rule, reason: reasonMap[id] || '' };
      })
      .filter(Boolean)
      .slice(0, 3);

    if (recommendations.length === 0) {
      return res.status(500).json({ error: 'LLM 未返回有效推荐' });
    }

    return res.json({ recommendations });
  } catch (e) {
    console.error('AI recommend rules error:', e);
    // Fallback: return top 3 by composite score
    const fallback = [...candidates]
      .sort((a, b) => (b.connRate * 0.4 + b.intentRate * 0.6) - (a.connRate * 0.4 + a.intentRate * 0.6))
      .slice(0, 3)
      .map(r => ({ ...r, reason: '基于历史接通率与意向率综合排序' }));
    return res.json({ recommendations: fallback, fallback: true });
  }
}
