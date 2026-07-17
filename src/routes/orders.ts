import { Router, Request, Response } from 'express';
import { query } from '../db';

interface Order {
  id: number;
  user_id: number;
  amount: number;
  created_at: Date;
}

export const ordersRouter = Router();

// GET /orders - List recent orders (uses updated query() signature)
ordersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await query<Order>(
      'SELECT id, user_id, amount, created_at FROM orders ORDER BY created_at DESC LIMIT 50',
      undefined,
      { timeoutMs: 5000, caller: 'orders.list' }
    );
    res.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /orders/:id - Get a single order
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orders = await query<Order>(
      'SELECT id, user_id, amount, created_at FROM orders WHERE id = ?',
      [id],
      { timeoutMs: 3000, caller: 'orders.getById' }
    );
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(orders[0]);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});
