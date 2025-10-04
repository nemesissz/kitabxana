import { executeQuery, getOne, insert, update } from '../config/database.js';
import adminService from '../admin/admin.service.js';

class SubscriptionService {
  async createSubscription(userId, plan) {
    // Check if user already has an active subscription
    const activeSubscription = await getOne(`
      SELECT id FROM subscriptions 
      WHERE user_id = ? AND status = 'active' AND end_date > NOW()
    `, [userId]);

    if (activeSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Calculate end date and price based on plan
    const startDate = new Date();
    const endDate = new Date(startDate);
    const planPrices = await this.getPlanPrices();
    
    if (!planPrices[plan]) {
      throw new Error('Invalid subscription plan');
    }
    
    const price = planPrices[plan].price;
    const durationMonths = planPrices[plan].durationMonths;
    
    // Dinamik olaraq müddəti əlavə edirik
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Create subscription
    const subscriptionId = await insert('subscriptions', {
      user_id: userId,
      plan: plan,
      price: price,
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    });

    return await getOne('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
  }

  async getUserSubscriptions(userId) {
    return await executeQuery(`
      SELECT * FROM subscriptions 
      WHERE user_id = ? 
      ORDER BY start_date DESC
    `, [userId]);
  }

  async getActiveSubscription(userId) {
    return await getOne(`
      SELECT * FROM subscriptions 
      WHERE user_id = ? AND status = 'active' AND end_date > NOW()
    `, [userId]);
  }

  async cancelSubscription(userId, subscriptionId) {
    // Check if subscription exists and belongs to user
    const subscription = await getOne(`
      SELECT id FROM subscriptions 
      WHERE id = ? AND user_id = ? AND status = 'active'
    `, [subscriptionId, userId]);

    if (!subscription) {
      throw new Error('Subscription not found or already cancelled');
    }

    // Update subscription status
    await update(`
      UPDATE subscriptions SET status = 'cancelled' WHERE id = ?
    `, [subscriptionId]);

    return await getOne('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
  }

  async getPlanPrices() {
    // Admin service-dən plan məlumatlarını götürürük
    return await adminService.getSubscriptionPlans();
  }
}

export default new SubscriptionService();