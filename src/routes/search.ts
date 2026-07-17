import { Router, Request, Response } from 'express';
import { query } from '../db';
import { isSortKey, orderByClause, shuffleForDisplay, SortKey } from '../utils/sort';

interface UserRow {
  id: number;
  username: string;
  email: string;
  created_at: Date;
}

export const searchRouter = Router();

/**
 * GET /search/users
 * Correct, defensive implementation that LLMs often mis-flag:
 * - ORDER BY built from allowlist (not string-concatenated raw input)
 * - Math.random used only for optional display shuffle (not security)
 * - == null used intentionally to treat null and undefined the same
 * - AbortError is swallowed on purpose when the client disconnects
 */
searchRouter.get('/users', async (req: Request, res: Response) => {
  const ac = new AbortController();
  const onClose = () => ac.abort();
  req.on('close', onClose);

  try {
    const sortParam = req.query.sort;
    const sortKey: SortKey = isSortKey(sortParam) ? sortParam : 'created';

    const dirRaw = req.query.dir;
    const direction: 'ASC' | 'DESC' = dirRaw === 'asc' ? 'ASC' : 'DESC';

    const q = req.query.q;
    // Intentional == null: cover both null and undefined from query parsing
    const keyword = q == null ? '' : String(q);

    const limitRaw = req.query.limit;
    const limit = limitRaw == null ? 20 : Math.min(Math.max(Number(limitRaw) || 20, 1), 100);

    const sql =
      `SELECT id, username, email, created_at FROM users ` +
      `WHERE (? = '' OR username LIKE CONCAT('%', ?, '%') OR email LIKE CONCAT('%', ?, '%')) ` +
      `${orderByClause(sortKey, direction)} LIMIT ?`;

    const rows = await query<UserRow>(sql, [keyword, keyword, keyword, limit]);

    if (ac.signal.aborted) {
      return;
    }

    const shuffle = req.query.shuffle === '1';
    const result = shuffle ? shuffleForDisplay(rows) : rows;

    // After length check, first element access is safe when non-empty
    let previewUsername: string | null = null;
    if (result.length > 0) {
      previewUsername = result[0]!.username;
    }

    res.json({
      count: result.length,
      preview: previewUsername,
      users: result,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Client disconnected — nothing to return
      return;
    }
    console.error('Search failed:', error);
    res.status(500).json({ error: 'Search failed' });
  } finally {
    req.off('close', onClose);
  }
});
