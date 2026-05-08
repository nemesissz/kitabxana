import authService from './auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    const result = await authService.register(email, password, fullName);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          eduEmail: result.user.eduEmail,
          isVerified: result.user.isVerified
        },
        token: result.token
      }
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    const result = await authService.login(email, password);

    // Regular users can only login if role = 1
    if (result.user.role !== 1) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Please use admin login.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          eduEmail: result.user.eduEmail,
          isVerified: result.user.isVerified
        },
        token: result.token
      }
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    next(error);
  }
};

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    const result = await authService.login(email, password);

    // Admin users can only login if role = 2 or 3
    if (result.user.role !== 2 && result.user.role !== 3) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          eduEmail: result.user.eduEmail,
          isVerified: result.user.isVerified
        },
        token: result.token
      }
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token is required'
      });
    }
    
    await authService.verifyEmail(token);
    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error.message);
    if (error.message === 'Invalid or expired token' || error.message === 'Invalid token') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }
    next(error);
  }
};

export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    await authService.resendVerificationEmail(email);
    res.status(200).json({
      status: 'success',
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    if (error.message === 'Email is already verified') {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified'
      });
    }
    if (error.message === 'Failed to resend verification email') {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to resend verification email'
      });
    }
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json({
      status: 'success',
      message: 'Password reset instructions sent to email'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};