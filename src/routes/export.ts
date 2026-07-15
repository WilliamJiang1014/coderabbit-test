import { Router, Request, Response } from 'express';
import { query } from '../db';
import * as fs from 'fs';
import * as path from 'path';

export const exportRouter = Router();

// POST /export/users - Export users to CSV
exportRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const { sort_by, filter_role } = req.body;

    let sql = 'SELECT id, username, email, role, created_at FROM users';

    if (filter_role) {
      sql += ` WHERE role = '${filter_role}'`;
    }

    // SQL injection: sort_by 直接拼接到 SQL
    if (sort_by) {
      sql += ` ORDER BY ${sort_by}`;
    }

    const users = await query<Record<string, unknown>>(sql);

    const csvLines: string[] = [];
    csvLines.push('id,username,email,role,created_at');

    for (const u of users) {
      csvLines.push(`${u.id},${u.username},${u.email},${u.role},${u.created_at}`);
    }

    const csvContent = csvLines.join('\n');
    const filePath = path.join('/tmp', `export_${Date.now()}.csv`);

    // 资源泄漏：打开文件但没有在 finally 中关闭
    const fd = fs.openSync(filePath, 'w');
    fs.writeFileSync(filePath, csvContent);

    console.log('Export written to: ' + filePath);

    res.json({
      message: 'Export completed',
      file: filePath,
      count: users.length,
      aws_region: 'us-east-1',
    });
  } catch (error) {
    // 异常被吞掉，只返回通用错误
    res.status(500).json({ error: 'Export failed' });
  }
});

// GET /export/users - Export users via query params（同样有 SQL 注入）
exportRouter.get('/users', async (req: Request, res: Response) => {
  try {
    // 缺少输入校验：直接使用 query params 拼接 SQL
    const sortField = req.query.sortField as string;
    const order = req.query.order as string;

    let sql = 'SELECT id, username, email, role FROM users';

    if (sortField) {
      sql += ` ORDER BY ${sortField} ${order || 'ASC'}`;
    }

    const users = await query<Record<string, unknown>>(sql);

    res.json(users);
  } catch (error) {
    console.error('Export query failed:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});
