const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));

// 静态文件服务
app.use(express.static('public'));

// 动态导入并注册所有 API 路由
async function loadApiRoutes() {
  // Auth
  const authLogin = (await import('./api/auth/login.js')).default;
  const authMe = (await import('./api/auth/me.js')).default;

  // Customer
  const customerRecommendRules = (await import('./api/customer/recommend-rules.js')).default;

  // Knowledge
  const knowledgeDelete = (await import('./api/knowledge/delete.js')).default;
  const knowledgeSearch = (await import('./api/knowledge/search.js')).default;
  const knowledgeStats = (await import('./api/knowledge/stats.js')).default;
  const knowledgeUpload = (await import('./api/knowledge/upload.js')).default;

  // Resources
  const resourcesIndex = (await import('./api/resources/index.js')).default;
  const resourcesKnowledgeBase = (await import('./api/resources/knowledge-base.js')).default;
  const resourcesSearch = (await import('./api/resources/search.js')).default;

  // Strategy
  const strategyRecommend = (await import('./api/strategy/recommend.js')).default;
  const strategyScriptGenerate = (await import('./api/strategy/script-generate.js')).default;

  // Tickets
  const ticketsIndex = (await import('./api/tickets/index.js')).default;
  const ticketsById = (await import('./api/tickets/[id].js')).default;

  // 包装 handler 为 Express 中间件
  const wrap = (handler) => async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: '服务器内部错误' });
      }
    }
  };

  // 注册所有路由
  app.post('/api/auth/login', wrap(authLogin));
  app.get('/api/auth/me', wrap(authMe));

  app.post('/api/customer/recommend-rules', wrap(customerRecommendRules));

  app.delete('/api/knowledge/delete', wrap(knowledgeDelete));
  app.post('/api/knowledge/search', wrap(knowledgeSearch));
  app.get('/api/knowledge/stats', wrap(knowledgeStats));
  app.post('/api/knowledge/upload', wrap(knowledgeUpload));

  app.get('/api/resources', wrap(resourcesIndex));
  app.get('/api/resources/knowledge-base', wrap(resourcesKnowledgeBase));
  app.post('/api/resources/search', wrap(resourcesSearch));

  app.post('/api/strategy/recommend', wrap(strategyRecommend));
  app.post('/api/strategy/script-generate', wrap(strategyScriptGenerate));

  app.get('/api/tickets', wrap(ticketsIndex));
  app.post('/api/tickets', wrap(ticketsIndex));
  app.get('/api/tickets/:id', wrap(ticketsById));
  app.put('/api/tickets/:id', wrap(ticketsById));
  app.delete('/api/tickets/:id', wrap(ticketsById));

  console.log('✓ All API routes loaded');
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// SPA 路由处理 - 所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

// 启动服务器
loadApiRoutes().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
