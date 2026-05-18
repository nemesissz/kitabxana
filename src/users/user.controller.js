import userService from './user.service.js';
import { getOne } from '../config/database.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, institutionId } = req.user;

    // Superadmin or no institution → global scope
    if (role >= 4 || !institutionId) {
      const institutionFilter = req.query.institutionId ? Number(req.query.institutionId) : null;
      const users = await userService.getAllUsers({ scope: 'global', institutionFilter });
      return res.json({ status: 'success', data: { users } });
    }

    const inst = await getOne('SELECT is_main FROM institutions WHERE id = ?', [institutionId]);
    const isMain = inst?.is_main ?? false;

    // Main institution manager → global scope
    if (isMain && role >= 3) {
      const institutionFilter = req.query.institutionId ? Number(req.query.institutionId) : null;
      const users = await userService.getAllUsers({ scope: 'global', institutionFilter });
      return res.json({ status: 'success', data: { users } });
    }

    // Main institution worker → sees all except superadmins and main institution managers
    if (isMain) {
      const users = await userService.getAllUsers({ scope: 'main_worker', callerInstId: institutionId });
      return res.json({ status: 'success', data: { users } });
    }

    // Non-main institution (any role) → own institution members (role<3) + users without institution
    const users = await userService.getAllUsers({ scope: 'nonmain_worker', callerInstId: institutionId });
    res.json({ status: 'success', data: { users } });
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

    // Yalnız müdiri (role>=3) işçi rolu (role=2) verə bilər; superadmin (role>=4) müdiri verə bilər
    const body = { ...req.body };
    if (body.role !== undefined) {
      const newRole = Number(body.role);
      if ((newRole >= 3 && role < 4) || (newRole >= 2 && role < 3)) {
        delete body.role;
      }
    }

    const user = await userService.updateUserById(targetUserId, body);
    
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

export const updatePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ status: 'error', message: 'Etibarlı istifadəçi ID-si tələb olunur' });
    }
    const user = await userService.updatePermissions(Number(id), req.body);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ status: 'error', message: 'User not found' });
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

    await userService.deleteUserById(Number(id), req.user?.login);

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