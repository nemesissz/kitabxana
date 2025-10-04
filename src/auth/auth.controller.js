import authService from './auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    const result = await authService.register(email, password);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          eduEmail: result.user.eduEmail
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

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          eduEmail: result.user.eduEmail
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
    await authService.verifyEmail(token);
    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
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