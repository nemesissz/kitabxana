import authService from './auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { login, password, fullName } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Login and password are required'
      });
    }

    const result = await authService.register(login, password, fullName);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: result.user.id,
          login: result.user.login,
          role: result.user.role,
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
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Login and password are required'
      });
    }

    const result = await authService.login(login, password);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: result.user.id,
          login: result.user.login,
          role: result.user.role,
          isVerified: result.user.isVerified,
          uploadPermission: result.user.uploadPermission
        },
        token: result.token
      }
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid login or password'
      });
    }
    next(error);
  }
};

export const adminLogin = async (req, res, next) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Login and password are required'
      });
    }

    const result = await authService.login(login, password);

    if (result.user.role < 2) {
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
          login: result.user.login,
          role: result.user.role,
          isVerified: result.user.isVerified
        },
        token: result.token
      }
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid login or password'
      });
    }
    next(error);
  }
};
