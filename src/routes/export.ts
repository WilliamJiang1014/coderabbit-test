import { Router, Request, Response } from 'express';
import { query } from '../db';

export const exportRouter = Router();

const ALLOWED_SORT_COLUMNS = ['id', 'username', 'email', 'role', 'created_at'];

function escapeCsvField(value: unknown): string {
  const str = String(value ?? '');
  if (str.length === 0) return '';
  const sanitized = /^[=+\-@]/.test(str) ? `'${str}` : str;
  return /[\",\n]/.test(sanitized) ? `"${sanitized.replace(/"/g, '""')}"` : sanitized;
}

// POST /export/users - Export users to CSV
exportRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const { sort_by, filter_role } = req.body;

    const params: unknown[] = [];
    let sql = 'SELECT id, username, email, role, created_at FROM users';

    if (filter_role) {
      sql += ' WHERE role = ?';
      params.push(filter_role);
    }

    if (sort_by && ALLOWED_SORT_COLUMNS.includes(sort_by)) {
      sql += ` ORDER BY ${sort_by}`;
    }

    const users = await query<Record<string, unknown>>(sql, params);

    const csvLines: string[] = [[
      'id', 'username', 'email', 'role', 'created_at'
    ].map(escapeCsvField).join(',')];

    for (const u of users) {
      csvLines.push([
        u.id, u.username, u.email, u.role, u.created_at
      ].map(escapeCsvField).join(','));
    }

    const csvContent = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// GET /export/users - Export users via query params
exportRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const sortField = req.query.sortField as string;
    const order = (req.query.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let sql = 'SELECT id, username, email, role FROM users';

    if (sortField && ALLOWED_SORT_COLUMNS.includes(sortField)) {
      sql += ` ORDER BY ${sortField} ${order}`;
    }

    const users = await query<Record<string, unknown>>(sql);

    res.json(users);
  } catch (error) {
    console.error('Export query failed:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});
