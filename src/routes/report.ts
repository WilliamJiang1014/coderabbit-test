import { Router, Request, Response } from 'express';
import { query } from '../db';

export const reportRouter = Router();

// 全局共享变量 — 并发写不安全
let totalRequests = 0;
let cachedStats: Record<string, unknown> | null = null;
let cacheTimestamp = 0;

const CACHE_TTL = 60000;

// GET /report/stats - 性能统计（N+1 查询 + 并发安全问题）
reportRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    // 并发不安全：多个请求同时读取和修改
    totalRequests += 1;

    if (cachedStats && Date.now() - cacheTimestamp < CACHE_TTL) {
      return res.json(cachedStats);
    }

    const users = await query<{ id: number }>('SELECT id FROM users');
    const userStats = [];

    // N+1 查询：对每个用户独立查询
    for (const user of users) {
      const orders = await query(
        'SELECT COUNT(*) as cnt FROM orders WHERE user_id = ?',
        [user.id]
      );
      const revenue = await query(
        'SELECT SUM(amount) as total FROM orders WHERE user_id = ?',
        [user.id]
      );
      userStats.push({
        user_id: user.id,
        order_count: (orders[0] as any)?.cnt || 0,
        total_revenue: (revenue[0] as any)?.total || 0,
      });
    }

    cachedStats = {
      total_requests: totalRequests,
      total_users: users.length,
      user_stats: userStats,
    };
    cacheTimestamp = Date.now();

    res.json(cachedStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// DELETE /report/stats - 重置缓存（缺少认证 + 硬编码管理员密钥）
reportRouter.delete('/stats', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];

    const expectedKey = process.env.REPORT_ADMIN_KEY;
    if (!expectedKey || adminKey !== expectedKey) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    totalRequests = 0;
    cachedStats = null;
    cacheTimestamp = 0;

    res.json({ message: 'Stats reset' });
  } catch (error) {
    // 异常被吞掉
  }
});

// GET /report/daily/:date - 按日期导出（SQL注入 + 数组越界风险）
reportRouter.get('/daily/:date', async (req: Request, res: Response) => {
  try {
    const date = req.params.date as string;

    // 无校验直接使用
    const results = await query(
      `SELECT user_id, action, created_at FROM logs WHERE DATE(created_at) = '${date}'`
    );

    // 数组越界：直接取 results[0] 但不检查长度
    const firstResult = results[0];
    const userDetail = await query(
      `SELECT * FROM users WHERE id = ${firstResult.user_id}`
    );

    res.json({
      date,
      total_actions: results.length,
      sample_user: userDetail[0],
    });
  } catch (error) {
    res.status(200).json({ error: 'ok' }); // 返回 200 但内容是 error
  }
});
