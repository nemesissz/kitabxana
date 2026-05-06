import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../utils/jwt.js';
import emailService from '../utils/email.js';
import userService from '../users/user.service.js';

class AuthService {
  async register(email, password) {
    // İstifadəçinin mövcudluğunu yoxlayırıq
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // .edu və .edu.az email yoxlaması
    const emailLower = email.toLowerCase();
    const isEduEmail = emailLower.endsWith('.edu') || emailLower.endsWith('.edu.az');
    
    // İstifadəçini yaradırıq (default role = 1)
    const user = await userService.createUser({
      email,
      password,
      role: 1, // Default User rolu (1)
      isVerified: false,
      eduEmail: isEduEmail
    });

    console.log('User created successfully:', { id: user.id, email: user.email });

    const token = generateToken(user);
    
    // Email göndərməyə çalışırıq, lakin xəta olsa da qeydiyyatı davam etdiririk
    try {
      // Xoşgəldiniz emaili göndər
      await emailService.sendWelcomeEmail(user.email);
      console.log('Welcome email sent successfully to:', user.email);
    } catch (error) {
      console.error('Failed to send welcome email:', error.message);
      // Email xətası qeydiyyatı dayandırmasın
    }
    
    try {
      // Email təsdiqləmə linki göndər
      const verificationToken = generateToken(user, '24h');
      await emailService.sendVerificationEmail(user.email, verificationToken);
      console.log('Verification email sent successfully to:', user.email);
    } catch (error) {
      console.error('Failed to send verification email:', error.message);
      // Email xətası qeydiyyatı dayandırmasın
    }
    
    return { user, token };
  }

  async login(email, password) {
    const user = await userService.findUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check active subscription
    const hasActiveSubscription = await userService.checkActiveSubscription(user.id);
    user.hasActiveSubscription = hasActiveSubscription;

    const token = generateToken(user);
    return { user, token };
  }

  async verifyEmail(token) {
    const decoded = verifyToken(token);
    if (!decoded || (!decoded.id && !decoded.userId)) {
      throw new Error('Invalid or expired token');
    }

    // Support both old and new token formats
    const userId = decoded.id || decoded.userId;
    const user = await userService.updateUserById(userId, { isVerified: true });
    return user;
  }

  async resendVerificationEmail(email) {
    console.log('Resending verification email to:', email);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    const user = await userService.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isVerified) {
      throw new Error('Email is already verified');
    }

    try {
      const verificationToken = generateToken(user, '24h');
      await emailService.sendVerificationEmail(user.email, verificationToken);
      console.log('Verification email resent successfully to:', user.email);
      return true;
    } catch (error) {
      console.error('Failed to resend verification email:', error.message);
      throw new Error('Failed to resend verification email');
    }
  }

  async forgotPassword(email) {
    console.log('Attempting password reset for email:', email);
    
    const user = await userService.findUserByEmail(email);
    if (!user) {
      console.log('Password reset attempted for non-existent user:', email);
      // Təhlükəsizlik üçün həmişə uğurlu cavab veririk
      // Lakin həqiqətdə email göndərmirik
      return true;
    }

    try {
      const resetToken = generateToken(user, '1h');
      await emailService.sendPasswordResetEmail(email, resetToken);
      console.log('Password reset email sent successfully to:', email);
    } catch (error) {
      console.error('Failed to send password reset email:', error.message);
      // Email xətası olsa da uğurlu cavab veririk
    }

    return true;
  }

  async resetPassword(token, newPassword) {
    const decoded = verifyToken(token);
    if (!decoded || (!decoded.id && !decoded.userId)) {
      throw new Error('Invalid or expired token');
    }

    // Support both old and new token formats
    const userId = decoded.id || decoded.userId;
    const user = await userService.updateUserById(userId, { password: newPassword });
    return user;
  }
}

export default new AuthService();