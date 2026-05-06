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
    const { price, durationMonths, description, plan_name } = req.body;

    const updatedPlan = await adminService.updateSubscriptionPlan(planId, {
      price: price ? Number(price) : undefined,
      durationMonths: durationMonths ? Number(durationMonths) : undefined,
      description,
      plan_name
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

export const createSubscriptionPlan = async (req, res, next) => {
  try {
    const { plan_id, plan_name, price, durationMonths, description } = req.body;

    if (!plan_id || !plan_name || !price || !durationMonths) {
      return res.status(400).json({
        status: 'error',
        message: 'All required fields must be provided'
      });
    }

    // Validasiya
    if (price <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Price must be greater than 0'
      });
    }

    if (durationMonths <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Duration must be greater than 0'
      });
    }

    // Try to insert into database
    try {
      const { executeQuery } = await import('../config/database.js');
      
      await executeQuery(`
        INSERT INTO subscription_prices (plan_code, plan_name, price, duration_months, description)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          plan_name = VALUES(plan_name),
          price = VALUES(price),
          duration_months = VALUES(duration_months),
          description = VALUES(description),
          is_active = 1
      `, [plan_id, plan_name, Number(price), Number(durationMonths), description]);
    } catch (error) {
      console.log('Database insert failed, adding to memory');
    }

    // Also add to memory
    adminService.subscriptionPlans[plan_id] = {
      plan_name,
      price: Number(price),
      durationMonths: Number(durationMonths),
      description,
      duration: `${durationMonths} ay`
    };

    res.status(201).json({
      status: 'success',
      message: 'Plan created successfully',
      data: {
        plan: {
          planId: plan_id,
          ...adminService.subscriptionPlans[plan_id]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// PDF Price Management
export const updatePdfPrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    // Validasiya
    if (price === undefined || price === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Price tələb olunur'
      });
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Qiymət 0 və ya müsbət rəqəm olmalıdır'
      });
    }

    const updatedPdf = await adminService.updatePdfPrice(id, numericPrice);

    res.status(200).json({
      status: 'success',
      data: {
        pdf: updatedPdf
      },
      message: 'PDF qiyməti uğurla yeniləndi'
    });
  } catch (error) {
    if (error.message === 'PDF not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const bulkUpdatePdfPrices = async (req, res, next) => {
  try {
    const { updates } = req.body;

    // Validasiya
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Updates array tələb olunur (format: [{id: 1, price: 10.50}, ...])'
      });
    }

    const results = await adminService.bulkUpdatePdfPrices(updates);

    res.status(200).json({
      status: 'success',
      data: {
        updated: results.success,
        failed: results.failed,
        total: updates.length
      },
      message: `${results.success.length} PDF qiyməti yeniləndi`
    });
  } catch (error) {
    next(error);
  }
};