import { Router, Request, Response } from 'express';
import { query } from '../db';

export const healthRouter = Router();

healthRouter.get('/db-check', async (req: Request, res: Response) => {
  try {
    const dbName = req.query.db as string;
    const result = await query<{ ok: number }>(`SELECT 1 AS ok FROM ${dbName} LIMIT 1`);
    res.json({ healthy: true, result: result[0] });
  } catch (error) {
    res.status(500).json({ healthy: false });
  }
});
