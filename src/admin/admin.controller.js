import adminService from './admin.service.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getStats();

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, isVerified, eduEmail, search } = req.query;
    
    // Boolean tipləri konvert et
    const filters = {
      role,
      search,
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
      eduEmail: eduEmail === 'true' ? true : eduEmail === 'false' ? false : undefined
    };

    const users = await adminService.getAllUsers(filters);

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

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await adminService.updateUserRole(id, role);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    if (error.message === 'Invalid role') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const getDashboardData = async (req, res, next) => {
  try {
    const dashboardData = await adminService.getDashboardData();

    res.status(200).json({
      status: 'success',
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

// Subscription Plan Management
export const getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await adminService.getSubscriptionPlans();

    res.status(200).json({
      status: 'success',
      data: {
        plans
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { price, durationMonths, description } = req.body;

    // Validasiya
    if (!price || !durationMonths || !description) {
      return res.status(400).json({
        status: 'error',
        message: 'Price, durationMonths və description tələb olunur'
      });
    }

    const updatedPlan = await adminService.updateSubscriptionPlan(planId, {
      price: Number(price),
      durationMonths: Number(durationMonths),
      description
    });

    res.status(200).json({
      status: 'success',
      data: {
        plan: updatedPlan
      },
      message: 'Plan uğurla yeniləndi'
    });
  } catch (error) {
    if (error.message.includes('Invalid plan') || error.message.includes('must be greater')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await adminService.getAllSubscriptions();

    res.status(200).json({
      status: 'success',
      data: {
        subscriptions
      }
    });
  } catch (error) {
    next(error);
  }
};
