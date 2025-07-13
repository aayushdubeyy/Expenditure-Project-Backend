import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

export const generateToken = (user: { id: string; email: string }, expiresIn = 60*60*24*7) => {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: expiresIn
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
};
