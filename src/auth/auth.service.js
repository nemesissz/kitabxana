import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import userService from '../users/user.service.js';
import activityLog from '../activity-logs/activity-log.service.js';

class AuthService {
  async register(login, password, fullName = null) {
    const existingUser = await userService.findUserByLogin(login);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await userService.createUser({
      login,
      password,
      fullName: fullName || null,
      role: 1,
    });

    const token = generateToken(user);
    return { user, token };
  }

  async login(login, password) {
    const user = await userService.findUserByLogin(login);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user);

    await activityLog.log({
      eventType: user.role >= 2 ? 'admin_login' : 'user_login',
      actorEmail: user.login,
      targetType: 'user',
      targetId: user.id,
      details: { login: user.login, role: user.role },
    });

    return { user, token };
  }
}

export default new AuthService();
