import subscriptionService from './subscription.service.js';
import { getOne } from '../config/database.js';

// Helper: .edu və .edu.az email yoxlaması və indirim hesablaması
const calculatePriceWithDiscount = (price, userEmail) => {
  if (!userEmail || !price) return { originalPrice: price, discountedPrice: price, hasDiscount: false, discountPercent: 0 };
  
  const emailLower = userEmail.toLowerCase();
  const isEduEmail = emailLower.endsWith('.edu') || emailLower.endsWith('.edu.az');
  
  if (isEduEmail) {
    const discountedPrice = price * 0.5; // %50 endirim
    return {
      originalPrice: price,
      discountedPrice: discountedPrice,
      hasDiscount: true,
      discountPercent: 50
    };
  }
  
  return { originalPrice: price, discountedPrice: price, hasDiscount: false, discountPercent: 0 };
};

export const createSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;

    if (!plan || !['1m', '3m', '6m', '12m'].includes(plan)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subscription plan'
      });
    }

    const subscription = await subscriptionService.createSubscription(userId, plan);

    res.status(201).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error) {
    if (error.message === 'User already has an active subscription') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const getMySubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscriptions = await subscriptionService.getUserSubscriptions(userId);

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

export const getActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = await subscriptionService.getActiveSubscription(userId);

    res.status(200).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subscriptionId } = req.params;

    const subscription = await subscriptionService.cancelSubscription(userId, Number(subscriptionId));

    res.status(200).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error) {
    if (error.message === 'Subscription not found or already cancelled') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const getPlanPrices = async (req, res, next) => {
  try {
    const prices = await subscriptionService.getPlanPrices();

    // İstifadəçi email-ni al (indirim üçün)
    let userEmail = null;
    if (req.user?.id) {
      const user = await getOne('SELECT email FROM users WHERE id = ?', [req.user.id]);
      if (user) {
        userEmail = user.email;
      }
    }

    // Hər plan üçün indirimli fiyat hesabla
    const pricesWithDiscount = {};
    for (const [planId, planData] of Object.entries(prices)) {
      const priceInfo = calculatePriceWithDiscount(planData.price, userEmail);
      pricesWithDiscount[planId] = {
        ...planData,
        price: planData.price,
        priceInfo: priceInfo
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        prices: pricesWithDiscount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getAllSubscriptions();

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

export const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(Number(id));

    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const subscription = await subscriptionService.updateSubscription(Number(id), updateData);

    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await subscriptionService.deleteSubscription(Number(id));

    if (!result) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const createSubscriptionAdmin = async (req, res, next) => {
  try {
    const { user_id, plan, price, start_date, end_date, status } = req.body;

    if (!user_id || !plan || !price || !start_date || !end_date || !status) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    const subscription = await subscriptionService.createSubscriptionAdmin({
      user_id: Number(user_id),
      plan,
      price: Number(price),
      start_date,
      end_date,
      status
    });

    res.status(201).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

// Sadələşdirilmiş admin abonelik yaratma - sadəcə user_id və plan qəbul edir
export const createSubscriptionAdminSimple = async (req, res, next) => {
  try {
    const { user_id, plan } = req.body;

    if (!user_id || !plan) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id və plan tələb olunur'
      });
    }

    // Plan məlumatlarını al
    const planPrices = await subscriptionService.getPlanPrices();
    
    if (!planPrices[plan]) {
      return res.status(400).json({
        status: 'error',
        message: 'Yanlış abonelik planı'
      });
    }

    const planData = planPrices[plan];
    const price = planData.price;
    const durationMonths = planData.durationMonths;

    // Tarixləri hesabla
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // İstifadəçinin aktiv aboneliği varmı yoxla
    const activeSubscription = await subscriptionService.getActiveSubscription(Number(user_id));
    
    if (activeSubscription && activeSubscription.plan !== 'none' && activeSubscription.status === 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'İstifadəçinin artıq aktiv aboneliyi var'
      });
    }

    // Aboneliği yarat
    const subscription = await subscriptionService.createSubscriptionAdmin({
      user_id: Number(user_id),
      plan,
      price: price,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active'
    });

    res.status(201).json({
      status: 'success',
      data: {
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
};