import { executeQuery, getOne, insert, update } from '../config/database.js';
import adminService from '../admin/admin.service.js';

class SubscriptionService {
  async createSubscription(userId, plan) {
    // Check if user already has an active subscription (exclude default 'none' plan)
    const activeSubscription = await getOne(`
      SELECT s.id FROM subscriptions s
      JOIN user_subscriptions us ON s.id = us.subscription_id
      WHERE us.user_id = ? AND s.status = 'active' AND s.end_date > NOW() AND s.plan != 'none'
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

    // Link subscription to user
    await insert('user_subscriptions', {
      user_id: userId,
      subscription_id: subscriptionId
    });

    return await getOne('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
  }

  async getUserSubscriptions(userId) {
    const subscriptions = await executeQuery(`
      SELECT s.* FROM subscriptions s
      JOIN user_subscriptions us ON s.id = us.subscription_id
      WHERE us.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);

    // If no subscriptions, return default subscription structure
    if (subscriptions.length === 0) {
      return [{
        id: null,
        plan: "none",
        status: null,
        start_date: null,
        end_date: null,
        price: null,
        created_at: null
      }];
    }

    return subscriptions;
  }

  async getActiveSubscription(userId) {
    const activeSubscription = await getOne(`
      SELECT s.* FROM subscriptions s
      JOIN user_subscriptions us ON s.id = us.subscription_id
      WHERE us.user_id = ? AND s.status = 'active' AND s.end_date > NOW()
    `, [userId]);

    // If no active subscription, return default structure
    if (!activeSubscription) {
      return {
        id: null,
        plan: "none",
        status: null,
        start_date: null,
        end_date: null,
        price: null,
        created_at: null
      };
    }

    return activeSubscription;
  }

  async cancelSubscription(userId, subscriptionId) {
    // Check if subscription exists and belongs to user
    const subscription = await getOne(`
      SELECT s.id FROM subscriptions s
      JOIN user_subscriptions us ON s.id = us.subscription_id
      WHERE s.id = ? AND us.user_id = ? AND s.status = 'active'
    `, [subscriptionId, userId]);

    if (!subscription) {
      throw new Error('Subscription not found or already cancelled');
    }

    // Update subscription status using the correct update function
    await update('subscriptions', subscriptionId, { status: 'cancelled' });

    return await getOne('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
  }

  async getPlanPrices() {
    // Admin service-dən plan məlumatlarını götürürük
    return await adminService.getSubscriptionPlans();
  }

  // Admin methods
  async getAllSubscriptions() {
    const subscriptions = await executeQuery(`
      SELECT 
        s.id, 
        s.user_id, 
        s.plan, 
        s.price, 
        s.start_date, 
        s.end_date, 
        s.status, 
        s.created_at,
        p.full_name as user_name,
        u.email as user_email
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN user_profiles p ON u.profile_id = p.id
      ORDER BY s.created_at DESC
    `);

    return subscriptions;
  }

  async getSubscriptionById(id) {
    const subscription = await getOne(`
      SELECT 
        s.*,
        p.full_name as user_name,
        u.email as user_email
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN user_profiles p ON u.profile_id = p.id
      WHERE s.id = ?
    `, [id]);

    return subscription;
  }

  async updateSubscription(id, updateData) {
    // Check if subscription exists
    const existing = await getOne('SELECT id FROM subscriptions WHERE id = ?', [id]);
    
    if (!existing) {
      return null;
    }

    await update('subscriptions', id, updateData);
    
    return await getOne('SELECT * FROM subscriptions WHERE id = ?', [id]);
  }

  async deleteSubscription(id) {
    // Check if subscription exists
    const existing = await getOne('SELECT id FROM subscriptions WHERE id = ?', [id]);
    
    if (!existing) {
      return null;
    }

    await executeQuery('DELETE FROM subscriptions WHERE id = ?', [id]);
    
    return true;
  }

  async createSubscriptionAdmin(data) {
    const { user_id, plan, price, start_date, end_date, status } = data;

    // Create subscription
    const subscriptionId = await insert('subscriptions', {
      user_id,
      plan,
      price,
      start_date,
      end_date,
      status
    });

    // Link subscription to user
    await insert('user_subscriptions', {
      user_id,
      subscription_id: subscriptionId
    });

    return await getOne('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
  }
}

export default new SubscriptionService();