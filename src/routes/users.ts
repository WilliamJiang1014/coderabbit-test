import { Router, Request, Response } from 'express';
import { query } from '../db';
import { isValidEmail, isValidUsername } from '../utils/validator';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
}

export const usersRouter = Router();

// GET /users - List all users
usersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await query<User>('SELECT id, username, email, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /users/:id - Get user by ID
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const users = await query<User>(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users - Create a new user
usersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const result = await query<User>(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    res.status(201).json({ id: (result as any).insertId, username, email });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /users/:id - Update user
usersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (username) {
      if (!isValidUsername(username)) {
        return res.status(400).json({ error: 'Invalid username' });
      }
      updates.push('username = ?');
      values.push(username);
    }

    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' });
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /users/:id - Delete user
usersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
