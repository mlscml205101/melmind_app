import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'melmind-dev-secret-degistirin';

export const signToken = (userId) => jwt.sign({ uid: userId }, SECRET, { expiresIn: '30d' });

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
  try {
    req.userId = jwt.verify(token, SECRET).uid;
    next();
  } catch {
    res.status(401).json({ error: 'Oturum süresi doldu, tekrar giriş yapın.' });
  }
}

// async route hatalarını yakalar
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
