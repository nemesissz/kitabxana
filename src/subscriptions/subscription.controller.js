import subscriptionService from './subscription.service.js';

export const createSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;

    if (!plan || !['1m', '3m', '6m'].includes(plan)) {
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

    res.status(200).json({
      status: 'success',
      data: {
        prices
      }
    });
  } catch (error) {
    next(error);
  }
};