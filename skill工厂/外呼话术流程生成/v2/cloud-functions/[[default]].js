import express from 'express';

// 导入所有 API handlers
import authLogin from '../api/auth/login.js';
import authMe from '../api/auth/me.js';
import customerRecommendRules from '../api/customer/recommend-rules.js';
import knowledgeDelete from '../api/knowledge/delete.js';
import knowledgeSearch from '../api/knowledge/search.js';
import knowledgeStats from '../api/knowledge/stats.js';
import knowledgeUpload from '../api/knowledge/upload.js';
import resourcesIndex from '../api/resources/index.js';
import resourcesKnowledgeBase from '../api/resources/knowledge-base.js';
import resourcesSearch from '../api/resources/search.js';
import strategyRecommend from '../api/strategy/recommend.js';
import strategyScriptGenerate from '../api/strategy/script-generate.js';
import ticketsIndex from '../api/tickets/index.js';
import ticketsById from '../api/tickets/[id].js';

const app = express();
app.use(express.json({ limit: '10mb' }));

// 辅助函数：包装 Vercel handler 为 Express 中间件
function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: '服务器内部错误' });
      }
    }
  };
}

// ============== 注册所有路由 ==============
// Auth
app.post('/api/auth/login', wrap(authLogin));
app.get('/api/auth/me', wrap(authMe));

// Customer
app.post('/api/customer/recommend-rules', wrap(customerRecommendRules));

// Knowledge
app.delete('/api/knowledge/delete', wrap(knowledgeDelete));
app.post('/api/knowledge/search', wrap(knowledgeSearch));
app.get('/api/knowledge/stats', wrap(knowledgeStats));
app.post('/api/knowledge/upload', wrap(knowledgeUpload));

// Resources
app.get('/api/resources', wrap(resourcesIndex));
app.get('/api/resources/knowledge-base', wrap(resourcesKnowledgeBase));
app.post('/api/resources/search', wrap(resourcesSearch));

// Strategy
app.post('/api/strategy/recommend', wrap(strategyRecommend));
app.post('/api/strategy/script-generate', wrap(strategyScriptGenerate));

// Tickets
app.get('/api/tickets', wrap(ticketsIndex));
app.post('/api/tickets', wrap(ticketsIndex));
app.get('/api/tickets/:id', wrap(ticketsById));
app.put('/api/tickets/:id', wrap(ticketsById));
app.delete('/api/tickets/:id', wrap(ticketsById));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 必须导出 Express 实例供 EdgeOne Pages 使用
export default app;

