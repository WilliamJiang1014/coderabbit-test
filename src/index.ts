import express from 'express';
import { usersRouter } from './routes/users';
import { authRouter } from './routes/auth';
import { exportRouter } from './routes/export';
import { healthRouter } from './routes/health';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/export', exportRouter);
app.use('/health', healthRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
