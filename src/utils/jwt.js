import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '24h';

export const generateToken = (user, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(
    { 
      id: user.id, // Changed from userId to id for consistency
      userId: user.id, 
      email: user.email,
      role: user.role, // Rəqəmsal rol (1: User, 2: Admin, 3: Supadmin)
      hasActiveSubscription: user.hasActiveSubscription || false // Aktiv abunəlik var?
    },
    JWT_SECRET,
    { expiresIn }
  );
};

export const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw new Error('Invalid token');
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};