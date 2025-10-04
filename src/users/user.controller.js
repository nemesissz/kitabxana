import userService from './user.service.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();

    res.status(200).json({
      status: 'success',
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // ID validasiyası
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: 'error',
        message: 'Etibarlı istifadəçi ID-si tələb olunur'
      });
    }

    const user = await userService.findUserById(Number(id));

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // ID validasiyası
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: 'error',
        message: 'Etibarlı istifadəçi ID-si tələb olunur'
      });
    }

    const targetUserId = Number(id);
    const { userId: currentUserId, role } = req.user;

    // İstifadəçi (rol 1) özünü yeniləmək istəyirsə (id-lər eynidir) VƏ ya Admin/Supadmin (rol 2 və ya daha yuxarıdırsa)
    const isSelfUpdate = targetUserId === currentUserId;
    const isAdminOrHigher = role >= 2;

    if (!isSelfUpdate && !isAdminOrHigher) {
      // Nə özünü yeniləyir, nə də Admin səviyyəsində deyil.
      return res.status(403).json({
        status: 'error',
        message: 'Yalnız öz profilinizi yeniləyə bilərsiniz və ya Admin səviyyəsi tələb olunur.'
      });
    }

    const user = await userService.updateUserById(targetUserId, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // ID validasiyası
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: 'error',
        message: 'Etibarlı istifadəçi ID-si tələb olunur'
      });
    }

    await userService.deleteUserById(Number(id));

    res.status(200).json({
      status: 'success',
      message: 'User successfully deleted'
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    next(error);
  }
};