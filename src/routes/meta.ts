import { Router, Request, Response } from 'express';
import { formatUserLabel, format_list_summary, pad_right } from '../utils/format';

export const metaRouter = Router();

// GET /meta/label — pure presentation helper, no I/O side effects
metaRouter.get('/label', (req: Request, res: Response) => {
  const username = typeof req.query.username === 'string' ? req.query.username : 'anonymous';
  const userId = Number(req.query.id);
  const id = Number.isFinite(userId) ? userId : 0;

  const label = formatUserLabel(username, id);
  const summary = format_list_summary(['health', 'users', 'auth']);
  const padded = pad_right(label, 32);

  res.json({
    label,
    summary,
    padded,
  });
});
