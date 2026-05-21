import { BUSINESS_CATEGORIES, SEGMENT_RULES } from '../data/segment-rules.js';
import { post } from '../api.js';

export async function renderCustomerPage() {
  const container = document.getElementById('page-customer');
  container.innerHTML = `
    <div class="segment-layout">
      <aside class="segment-filter">
        <div class="filter-head">
          <h3>客群条件</h3>
          <input class="filter-search" placeholder="搜索标签..." id="tag-search" />
        </div>
        <div class="selected-bar">
          <div class="selected-head">
            <span>已选条件 <strong id="chip-count" style="color:var(--primary)">0</strong></span>
            <div class="logic-toggle" id="logic-toggle">
              <span class="logic-opt active" data-logic="AND">AND</span>
              <span class="logic-opt" data-logic="OR">OR</span>
            </div>
          </div>
          <div class="chips" id="chips"><span class="empty-chips">从下方选择标签</span></div>
        </div>
        <div class="filter-tree" id="filter-tree"></div>
      </aside>

      <div class="segment-main">
        <div class="segment-main-header">
          <div class="segment-main-title">客群分层策略</div>
          <div class="segment-main-actions">
            <div id="excel-status" class="excel-status-inline"></div>
            <label class="btn btn-secondary btn-upload-top" for="excel-file-input">📄 上传客群Excel</label>
            <input type="file" id="excel-file-input" accept=".xlsx,.xls,.csv" style="display:none" />
          </div>
        </div>
        <div class="tier-cards">
          <div class="tier-card active" data-mode="rule">
            <div class="tier-name">📐 规则优先 <span class="badge badge-accepted">推荐</span></div>
            <div class="tier-desc">基于 RFM 模型的客群分层</div>
            <div class="tier-threshold">R≤30d · F≥3 · M≥¥50K</div>
          </div>
          <div class="tier-card" data-mode="model">
            <div class="tier-name">🤖 模型驱动 <span class="badge badge-reviewing">AI</span></div>
            <div class="tier-desc">AI 预测意向/转化概率</div>
            <div class="tier-threshold">阈值 ≥ 0.70 · v3.2</div>
          </div>
          <div class="tier-card" data-mode="manual">
            <div class="tier-name">⚙️ 手动调权 <span class="badge badge-approval">高级</span></div>
            <div class="tier-desc">自定义各维度权重</div>
            <div class="tier-threshold">标签40% · 行为30% · 模型30%</div>
          </div>
        </div>

        <div class="config-panel" id="config-panel">
          <div class="config-panel-head">
            <span id="config-title">📐 RFM 模型参数</span>
            <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" id="btn-collapse">收起 ▴</button>
          </div>
          <div class="config-panel-body" id="config-body"></div>
          <div class="tier-action-bar" id="tier-action-bar" style="display:none">
            <span class="tier-action-info">已选 <strong id="tier-sel-count">0</strong> 个客群 · <strong id="tier-sel-people">0</strong> 人</span>
            <div class="tier-action-btns">
              <button class="btn btn-secondary" id="btn-clear-tier-sel">清除选择</button>
              <button class="btn btn-primary" id="btn-create-segment">生成客群</button>
            </div>
          </div>
        </div>

        <div class="preview-section">
          <div class="preview-head">
            <div class="hit-number">
              <div class="hit-num" id="hit-num">487,250</div>
              <div class="hit-meta">命中客户 · 占长尾池 <span id="hit-pct">100.0%</span></div>
            </div>
            <div class="hit-stats">
              <div class="hit-stat"><div class="hit-stat-label">日均触达</div><div class="hit-stat-value" id="stat-daily">≈12,180/日</div></div>
              <div class="hit-stat"><div class="hit-stat-label">预测意向</div><div class="hit-stat-value green" id="stat-intent">≈32,800</div></div>
              <div class="hit-stat"><div class="hit-stat-label">预计ROI</div><div class="hit-stat-value primary" id="stat-roi">1:4.8</div></div>
            </div>
            <div class="preview-actions">
              <button class="btn btn-secondary" id="btn-export">导出客群</button>
              <button class="btn btn-primary" id="btn-save-segment">保存客群</button>
            </div>
          </div>

          <div class="insight-grid">
            <div class="insight-tile">
              <h5>年龄段</h5>
              <div class="bar-mini">
                <div class="bar-row"><span class="bar-label">18-30</span><div class="bar-track"><div class="bar-fill" style="width:21%"></div></div><span class="bar-val">21%</span></div>
                <div class="bar-row"><span class="bar-label">31-45</span><div class="bar-track"><div class="bar-fill" style="width:42%"></div></div><span class="bar-val">42%</span></div>
                <div class="bar-row"><span class="bar-label">46-60</span><div class="bar-track"><div class="bar-fill" style="width:28%"></div></div><span class="bar-val">28%</span></div>
                <div class="bar-row"><span class="bar-label">60+</span><div class="bar-track"><div class="bar-fill" style="width:9%"></div></div><span class="bar-val">9%</span></div>
              </div>
            </div>
            <div class="insight-tile">
              <h5>AUM 分布</h5>
              <div class="bar-mini">
                <div class="bar-row"><span class="bar-label">≤5万</span><div class="bar-track"><div class="bar-fill" style="width:38%"></div></div><span class="bar-val">38%</span></div>
                <div class="bar-row"><span class="bar-label">5-20万</span><div class="bar-track"><div class="bar-fill" style="width:34%"></div></div><span class="bar-val">34%</span></div>
                <div class="bar-row"><span class="bar-label">20-50万</span><div class="bar-track"><div class="bar-fill" style="width:19%"></div></div><span class="bar-val">19%</span></div>
                <div class="bar-row"><span class="bar-label">50万+</span><div class="bar-track"><div class="bar-fill" style="width:9%"></div></div><span class="bar-val">9%</span></div>
              </div>
            </div>
            <div class="insight-tile">
              <h5>地域 Top5</h5>
              <div class="region-list">
                <div class="region-row"><span>上海</span><span class="region-val">18.4%</span></div>
                <div class="region-row"><span>北京</span><span class="region-val">15.1%</span></div>
                <div class="region-row"><span>深圳</span><span class="region-val">12.7%</span></div>
                <div class="region-row"><span>广州</span><span class="region-val">9.8%</span></div>
                <div class="region-row"><span>杭州</span><span class="region-val">7.2%</span></div>
              </div>
            </div>
            <div class="insight-tile">
              <h5>活跃度</h5>
              <div class="bar-mini">
                <div class="bar-row"><span class="bar-label">高频</span><div class="bar-track"><div class="bar-fill" style="width:28%"></div></div><span class="bar-val">28%</span></div>
                <div class="bar-row"><span class="bar-label">中频</span><div class="bar-track"><div class="bar-fill" style="width:25%"></div></div><span class="bar-val">25%</span></div>
                <div class="bar-row"><span class="bar-label">低频</span><div class="bar-track"><div class="bar-fill" style="width:20%"></div></div><span class="bar-val">20%</span></div>
                <div class="bar-row"><span class="bar-label">沉默</span><div class="bar-track"><div class="bar-fill" style="width:27%"></div></div><span class="bar-val">27%</span></div>
              </div>
            </div>
          </div>

          <div class="sample-section">
            <div class="sample-head">
              <h4>客户样本预览（前10条 · 已脱敏）</h4>
            </div>
            <div class="table-wrap" id="sample-table-wrap"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  initSegmentPage();
}

// PLACEHOLDER_SEGMENT_LOGIC

const TAG_TREE = [
  { group: '人口属性', tags: [
    { name: '年轻白领', count: '34.5万' },
    { name: '亲子家庭', count: '28.1万' },
    { name: '退休人群', count: '19.6万' },
    { name: '小微企业主', count: '12.3万' },
  ]},
  { group: '资产层级', tags: [
    { name: 'AUM 5-20万', count: '42.7万' },
    { name: 'AUM 20-50万', count: '23.4万' },
    { name: 'AUM 50-200万', count: '11.2万' },
    { name: 'AUM 200万+', count: '3.1万' },
  ]},
  { group: '行为偏好', tags: [
    { name: '理财活跃', count: '18.7万' },
    { name: '理财沉睡', count: '24.3万' },
    { name: 'APP高频登录', count: '32.1万' },
    { name: '近30天交易', count: '21.5万' },
    { name: '信用卡活跃', count: '14.9万' },
  ]},
  { group: '风险等级', tags: [
    { name: '保守型', count: '22.4万' },
    { name: '稳健型', count: '28.6万' },
    { name: '平衡型', count: '15.2万' },
    { name: '进取型', count: '6.8万' },
  ]},
  { group: '生命周期', tags: [
    { name: '新户期（≤90天）', count: '8.4万' },
    { name: '成长期', count: '31.2万' },
    { name: '成熟期', count: '42.6万' },
    { name: '衰退期', count: '12.8万' },
    { name: '流失风险', count: '5.7万' },
  ]},
  { group: '代发薪', tags: [
    { name: '代发薪客户', count: '56.8万' },
    { name: '非代发薪', count: '65.2万' },
  ]},
];

const SAMPLE_CUSTOMERS = [
  { id: 'C20260001', name: '张**', region: '上海', aum: 182000, tags: ['年轻白领','理财活跃'], rfm: '重要价值', intent: 89 },
  { id: 'C20260002', name: '李**', region: '北京', aum: 356000, tags: ['AUM 20-50万','成熟期'], rfm: '重要发展', intent: 76 },
  { id: 'C20260003', name: '王**', region: '深圳', aum: 89000, tags: ['信用卡活跃','成长期'], rfm: '一般发展', intent: 62 },
  { id: 'C20260004', name: '赵**', region: '广州', aum: 520000, tags: ['AUM 50-200万','稳健型'], rfm: '重要保持', intent: 84 },
  { id: 'C20260005', name: '陈**', region: '杭州', aum: 45000, tags: ['APP高频登录','新户期（≤90天）'], rfm: '一般价值', intent: 55 },
  { id: 'C20260006', name: '刘**', region: '成都', aum: 128000, tags: ['代发薪客户','理财沉睡'], rfm: '重要挽留', intent: 71 },
  { id: 'C20260007', name: '孙**', region: '南京', aum: 67000, tags: ['亲子家庭','保守型'], rfm: '一般保持', intent: 48 },
  { id: 'C20260008', name: '周**', region: '武汉', aum: 234000, tags: ['小微企业主','进取型'], rfm: '重要发展', intent: 82 },
  { id: 'C20260009', name: '吴**', region: '重庆', aum: 31000, tags: ['年轻白领','近30天交易'], rfm: '一般发展', intent: 59 },
  { id: 'C20260010', name: '郑**', region: '天津', aum: 410000, tags: ['退休人群','AUM 50-200万'], rfm: '重要价值', intent: 91 },
];

function initSegmentPage() {
  const selectedTags = new Set();
  const selectedTiers = new Set();
  let logic = 'AND';
  let mode = 'rule';
  let excelData = null;

  renderFilterTree();
  renderConfigPanel();
  renderSampleTable();
  bindEvents();

  function renderFilterTree() {
    const tree = document.getElementById('filter-tree');
    tree.innerHTML = TAG_TREE.map((g, i) => `
      <div class="tag-group ${i < 3 ? 'open' : ''}">
        <div class="group-head"><span class="caret">▶</span>${g.group}<span class="group-count">${g.tags.length}</span></div>
        <div class="group-body">
          ${g.tags.map(t => `
            <label class="tag-row" data-tag="${t.name}" data-count="${t.count}">
              <input type="checkbox" />
              <span class="tag-name">${t.name}</span>
              <span class="tag-count">${t.count}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function bindEvents() {
    document.querySelectorAll('#filter-tree .group-head').forEach(h => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('open'));
    });

    document.querySelectorAll('#filter-tree input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const tag = cb.closest('.tag-row').dataset.tag;
        if (cb.checked) selectedTags.add(tag); else selectedTags.delete(tag);
        updatePreview();
      });
    });

    document.querySelectorAll('#logic-toggle .logic-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('#logic-toggle .logic-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        logic = opt.dataset.logic;
        updatePreview();
      });
    });

    document.querySelectorAll('.tier-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        mode = card.dataset.mode;
        renderConfigPanel();
        renderSampleTable();
      });
    });

    document.getElementById('btn-collapse').addEventListener('click', () => {
      const body = document.getElementById('config-body');
      const btn = document.getElementById('btn-collapse');
      if (body.style.display === 'none') {
        body.style.display = 'block';
        btn.textContent = '收起 ▴';
      } else {
        body.style.display = 'none';
        btn.textContent = '展开 ▾';
      }
    });

    document.getElementById('excel-file-input').addEventListener('change', handleExcelUpload);

    document.getElementById('btn-export').addEventListener('click', () => {
      showToast('客群数据导出中...');
    });

    document.getElementById('btn-save-segment').addEventListener('click', () => {
      const name = selectedTags.size > 0 ? [...selectedTags].slice(0, 2).join('+') + '客群' : '全量长尾客群';
      showToast(`客群「${name}」已保存`);
    });

    document.getElementById('tag-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#filter-tree .tag-row').forEach(row => {
        row.style.display = row.dataset.tag.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    document.getElementById('btn-clear-tier-sel').addEventListener('click', () => {
      selectedTiers.clear();
      document.querySelectorAll('#config-body .tier-row').forEach(r => r.classList.remove('selected'));
      updateTierActionBar();
    });

    document.getElementById('btn-create-segment').addEventListener('click', () => {
      const names = [...selectedTiers].join(' + ');
      showToast(`客群「${names}」已生成`);
    });
  }

  function parseCount(c) {
    const m = c.match(/([\d.]+)([万亿千]?)/);
    if (!m) return 100000;
    const n = parseFloat(m[1]);
    return Math.round(n * (m[2] === '万' ? 10000 : m[2] === '亿' ? 100000000 : 1));
  }

  function updatePreview() {
    const chipsEl = document.getElementById('chips');
    document.getElementById('chip-count').textContent = selectedTags.size;

    if (selectedTags.size === 0) {
      chipsEl.innerHTML = '<span class="empty-chips">从下方选择标签</span>';
    } else {
      chipsEl.innerHTML = [...selectedTags].map(t =>
        `<span class="chip">${t} <span class="chip-x" data-tag="${t}">×</span></span>`
      ).join('');
      chipsEl.querySelectorAll('.chip-x').forEach(x => {
        x.addEventListener('click', () => {
          selectedTags.delete(x.dataset.tag);
          const cb = document.querySelector(`#filter-tree .tag-row[data-tag="${x.dataset.tag}"] input`);
          if (cb) cb.checked = false;
          updatePreview();
        });
      });
    }

    const baseTotal = 487250;
    let hit;
    if (selectedTags.size === 0) {
      hit = baseTotal;
    } else {
      const counts = [...selectedTags].map(t => {
        const el = document.querySelector(`#filter-tree .tag-row[data-tag="${t}"]`);
        return el ? parseCount(el.dataset.count) : 50000;
      });
      if (logic === 'AND') {
        hit = Math.round(Math.min(...counts) * Math.pow(0.55, counts.length - 1));
      } else {
        hit = Math.min(baseTotal, Math.round(counts.reduce((a, b) => a + b, 0) * 0.78));
      }
    }

    if (excelData) {
      hit = Math.min(hit, excelData.length);
    }

    document.getElementById('hit-num').textContent = hit.toLocaleString();
    document.getElementById('hit-pct').textContent = (hit / baseTotal * 100).toFixed(1) + '%';
    document.getElementById('stat-daily').textContent = '≈' + Math.round(hit * 0.025).toLocaleString() + '/日';
    document.getElementById('stat-intent').textContent = '≈' + Math.round(hit * 0.067).toLocaleString();
    document.getElementById('stat-roi').textContent = '1:' + Math.max(1.5, (4.8 - selectedTags.size * 0.2).toFixed(1));
  }

  function renderConfigPanel() {
    const title = document.getElementById('config-title');
    const body = document.getElementById('config-body');
    selectedTiers.clear();
    updateTierActionBar();

    function tierRow(color, name, rule, count) {
      return `<div class="tier-row" data-name="${name}" data-count="${count}">
        <span class="select-icon"></span>
        <span class="tier-dot" style="background:${color}"></span>
        <span class="tier-row-name">${name}</span>
        <span class="tier-rule">${rule}</span>
        <span class="tier-count-val">${count}</span>
      </div>`;
    }

    if (mode === 'rule') {
      title.textContent = '📐 RFM 模型参数';
      body.innerHTML = `
        <div class="smart-rec-bar">
          <div class="smart-rec-head">
            <span class="smart-rec-title">🧠 智能规则推荐</span>
            <span class="smart-rec-desc">基于 48 条历史沉淀规则，LLM 推荐最优 3 条</span>
          </div>
          <div class="smart-rec-form">
            <select id="smart-rec-business" class="smart-rec-select">
              <option value="">选择外呼业务场景...</option>
              ${BUSINESS_CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
            </select>
            <button class="btn btn-primary" id="btn-smart-rec">推荐规则</button>
          </div>
          <div class="smart-rec-results" id="smart-rec-results"></div>
        </div>
        <div class="config-sliders">
          <div class="slider-row"><span class="slider-label">R · 最近交易</span><input type="range" min="1" max="180" value="30" /><span class="slider-val">≤ 30天</span></div>
          <div class="slider-row"><span class="slider-label">F · 交易频次</span><input type="range" min="1" max="20" value="3" /><span class="slider-val">≥ 3次/月</span></div>
          <div class="slider-row"><span class="slider-label">M · 交易金额</span><input type="range" min="1" max="500" value="50" /><span class="slider-val">≥ ¥50K</span></div>
        </div>
        <div class="tier-rows">
          ${tierRow('#10B981','重要价值客户','R≤30 AND F≥5 AND M≥¥100K','12,450人')}
          ${tierRow('#667eea','重要发展客户','R≤30 AND F<5 AND M≥¥50K','28,310人')}
          ${tierRow('#F59E0B','重要保持客户','R>30 AND F≥5 AND M≥¥50K','15,680人')}
          ${tierRow('#EF4444','重要挽留客户','R>90 AND F≥5 AND M≥¥100K','4,820人')}
          ${tierRow('#94A3B8','一般客户','其余组合','425,990人')}
        </div>`;
      bindSmartRecEvents();
    } else if (mode === 'model') {
      title.textContent = '🤖 意向度预测模型 v3.2';
      body.innerHTML = `
        <div class="model-info-grid">
          <div class="model-info-item"><span class="k">算法</span><span class="v">LightGBM + 特征工程</span></div>
          <div class="model-info-item"><span class="k">AUC</span><span class="v green">0.847</span></div>
          <div class="model-info-item"><span class="k">特征维度</span><span class="v">147维</span></div>
          <div class="model-info-item"><span class="k">KS</span><span class="v green">0.521</span></div>
          <div class="model-info-item"><span class="k">训练数据</span><span class="v">386万条</span></div>
          <div class="model-info-item"><span class="k">召回率</span><span class="v">68.4%</span></div>
        </div>
        <div class="config-sliders" style="margin-top:12px">
          <div class="slider-row"><span class="slider-label">意向阈值</span><input type="range" min="10" max="99" value="70" /><span class="slider-val">≥ 0.70</span></div>
        </div>
        <div class="tier-rows">
          ${tierRow('#10B981','极高意向（≥0.9）','intent ≥ 0.90','6,820人')}
          ${tierRow('#667eea','高意向（0.7-0.9）','0.70 ≤ intent < 0.90','18,450人')}
          ${tierRow('#F59E0B','中意向（0.5-0.7）','0.50 ≤ intent < 0.70','52,310人')}
          ${tierRow('#EF4444','低意向（<0.5）','intent < 0.50','409,670人')}
        </div>`;
    } else {
      title.textContent = '⚙️ 手动调权配置';
      body.innerHTML = `
        <div class="config-sliders">
          <div class="slider-row"><span class="slider-label">标签匹配度</span><input type="range" min="0" max="100" value="40" /><span class="slider-val">40%</span></div>
          <div class="slider-row"><span class="slider-label">行为活跃度</span><input type="range" min="0" max="100" value="30" /><span class="slider-val">30%</span></div>
          <div class="slider-row"><span class="slider-label">模型评分</span><input type="range" min="0" max="100" value="30" /><span class="slider-val">30%</span></div>
        </div>
        <div class="weight-total">权重合计：<strong style="color:var(--success)">100%</strong></div>
        <div class="tier-rows">
          ${tierRow('#10B981','S级（85+）','综合评分 ≥ 85','8,420人')}
          ${tierRow('#667eea','A级（70-85）','70 ≤ 评分 < 85','42,180人')}
          ${tierRow('#F59E0B','B级（55-70）','55 ≤ 评分 < 70','126,850人')}
          ${tierRow('#94A3B8','C级（<55）','评分 < 55','309,800人')}
        </div>`;
    }

    body.querySelectorAll('.tier-row').forEach(row => {
      row.addEventListener('click', () => {
        const name = row.dataset.name;
        if (selectedTiers.has(name)) {
          selectedTiers.delete(name);
          row.classList.remove('selected');
        } else {
          selectedTiers.add(name);
          row.classList.add('selected');
        }
        updateTierActionBar();
      });
    });

    body.querySelectorAll('input[type=range]').forEach(s => {
      s.addEventListener('input', () => {
        const val = s.closest('.slider-row').querySelector('.slider-val');
        if (mode === 'rule') {
          const label = s.closest('.slider-row').querySelector('.slider-label').textContent;
          if (label.includes('R')) val.textContent = '≤ ' + s.value + '天';
          else if (label.includes('F')) val.textContent = '≥ ' + s.value + '次/月';
          else val.textContent = '≥ ¥' + s.value + 'K';
        } else if (mode === 'model') {
          val.textContent = '≥ 0.' + String(s.value).padStart(2, '0');
        } else {
          val.textContent = s.value + '%';
        }
      });
    });
  }

  function bindSmartRecEvents() {
    const btn = document.getElementById('btn-smart-rec');
    if (!btn) return;
    btn.addEventListener('click', handleSmartRec);
  }

  async function handleSmartRec() {
    const select = document.getElementById('smart-rec-business');
    const resultsEl = document.getElementById('smart-rec-results');
    const business = select.value;

    if (!business) {
      resultsEl.innerHTML = '<div class="smart-rec-tip">请先选择外呼业务场景</div>';
      return;
    }

    const candidates = SEGMENT_RULES.filter(r => r.business === business);
    if (candidates.length === 0) {
      resultsEl.innerHTML = '<div class="smart-rec-tip">该业务下暂无候选规则</div>';
      return;
    }

    resultsEl.innerHTML = `
      <div class="smart-rec-loading">
        <span class="smart-rec-dot"></span>
        <span class="smart-rec-dot"></span>
        <span class="smart-rec-dot"></span>
        <span class="smart-rec-loading-text">AI 正在分析 ${candidates.length} 条候选规则...</span>
      </div>`;

    try {
      const data = await post('/api/customer/recommend-rules', {
        business,
        selectedTags: [...selectedTags],
        candidates
      });
      renderSmartRecResults(data.recommendations || [], data.fallback);
    } catch (e) {
      resultsEl.innerHTML = `<div class="smart-rec-tip smart-rec-tip-err">推荐失败：${e.message}</div>`;
    }
  }

  function renderSmartRecResults(list, isFallback) {
    const resultsEl = document.getElementById('smart-rec-results');
    if (!list || list.length === 0) {
      resultsEl.innerHTML = '<div class="smart-rec-tip">未获得有效推荐</div>';
      return;
    }

    resultsEl.innerHTML = `
      ${isFallback ? '<div class="smart-rec-fallback-note">⚠️ AI 服务暂不可用，已按综合得分排序</div>' : ''}
      <div class="smart-rec-cards">
        ${list.map((r, i) => `
          <div class="smart-rec-card" data-rule-id="${r.id}">
            <div class="smart-rec-card-head">
              <span class="smart-rec-card-rank">#${i + 1}</span>
              <span class="smart-rec-card-group">${r.group}</span>
            </div>
            <div class="smart-rec-card-rule">${r.rule}</div>
            <div class="smart-rec-card-rates">
              <span class="smart-rec-rate"><em>接通率</em><b>${r.connRate}%</b></span>
              <span class="smart-rec-rate"><em>意向率</em><b>${r.intentRate}%</b></span>
            </div>
            ${r.reason ? `<div class="smart-rec-card-reason">💡 ${r.reason}</div>` : ''}
            <button class="btn btn-secondary smart-rec-apply" data-rule-id="${r.id}" data-group="${r.group}">应用此规则</button>
          </div>
        `).join('')}
      </div>`;

    resultsEl.querySelectorAll('.smart-rec-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.ruleId;
        const group = btn.dataset.group;
        const chipName = `📐 ${group} (规则#${id})`;
        if (selectedTags.has(chipName)) {
          showToast('已应用过该规则');
          return;
        }
        selectedTags.add(chipName);
        updatePreview();
        btn.textContent = '✓ 已应用';
        btn.disabled = true;
        showToast(`规则「${group}」已加入客群条件`);
      });
    });
  }

  function parsePeopleCount(str) {
    const m = str.replace(/,/g, '').match(/([\d.]+)/);
    return m ? parseInt(m[1]) : 0;
  }

  function updateTierActionBar() {
    const bar = document.getElementById('tier-action-bar');
    if (selectedTiers.size === 0) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    document.getElementById('tier-sel-count').textContent = selectedTiers.size;
    let total = 0;
    document.querySelectorAll('#config-body .tier-row.selected').forEach(row => {
      total += parsePeopleCount(row.dataset.count);
    });
    document.getElementById('tier-sel-people').textContent = total.toLocaleString();
  }

  function renderSampleTable() {
    const lastCol = mode === 'rule' ? 'RFM分层' : mode === 'model' ? '意向评分' : '综合分';
    const wrap = document.getElementById('sample-table-wrap');
    wrap.innerHTML = `<table>
      <thead><tr><th>客户号</th><th>姓名</th><th>地域</th><th>AUM</th><th>标签</th><th>${lastCol}</th></tr></thead>
      <tbody>${SAMPLE_CUSTOMERS.map(c => {
        let last;
        if (mode === 'rule') last = `<span class="badge badge-accepted">${c.rfm}</span>`;
        else if (mode === 'model') last = `<span style="font-weight:600;color:${c.intent >= 75 ? 'var(--success)' : c.intent >= 50 ? 'var(--warning)' : 'var(--danger)'}">${c.intent}</span>`;
        else last = `<span style="font-weight:600">${Math.round(c.intent * 0.6 + (c.aum > 200000 ? 30 : c.aum > 50000 ? 20 : 10))}/100</span>`;
        return `<tr>
          <td style="color:var(--text-muted);font-size:12px">${c.id}</td>
          <td>${c.name}</td>
          <td>${c.region}</td>
          <td>¥${c.aum.toLocaleString()}</td>
          <td>${c.tags.map(t => `<span class="badge badge-reviewing" style="margin-right:4px">${t}</span>`).join('')}</td>
          <td>${last}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  }

  async function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const XLSX = window.XLSX;
    if (!XLSX) { alert('Excel 解析库未加载'); return; }

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    excelData = XLSX.utils.sheet_to_json(ws);

    if (excelData.length === 0) { alert('文件为空'); return; }

    document.getElementById('excel-status').innerHTML = `
      <div class="excel-loaded">
        <span>📄 ${file.name}</span>
        <span class="excel-count">${excelData.length} 条记录</span>
        <button class="btn-clear-excel" id="btn-clear-excel">清除</button>
      </div>
    `;
    document.getElementById('btn-clear-excel').addEventListener('click', () => {
      excelData = null;
      document.getElementById('excel-status').innerHTML = '';
      document.getElementById('excel-file-input').value = '';
      updatePreview();
    });

    updatePreview();
    showToast(`已加载 ${excelData.length} 条客户数据`);
  }
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast toast-success';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
