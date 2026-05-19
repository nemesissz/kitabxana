import { executeQuery, getOne, insert, update } from '../config/database.js';
import adminService from '../admin/admin.service.js';

class SubscriptionService {
  async createSubscription(userId, plan) {
    throw new Error('Subscription sistemi deaktivdir');
  }

  async getUserSubscriptions(userId) {
    try {
      const subscriptions = await executeQuery(`
        SELECT s.* FROM subscriptions s
        JOIN user_subscriptions us ON s.id = us.subscription_id
        WHERE us.user_id = ?
        ORDER BY s.created_at DESC
      `, [userId]);

      if (subscriptions.length === 0) {
        return [{ id: null, plan: "none", status: null, start_date: null, end_date: null, price: null, created_at: null }];
      }
      return subscriptions;
    } catch (_) {
      return [{ id: null, plan: "none", status: null, start_date: null, end_date: null, price: null, created_at: null }];
    }
  }

  async getActiveSubscription(userId) {
    let activeSubscription = null;
    try {
      activeSubscription = await getOne(`
        SELECT s.* FROM subscriptions s
        JOIN user_subscriptions us ON s.id = us.subscription_id
        WHERE us.user_id = ? AND s.status = 'active' AND s.end_date > NOW()
      `, [userId]);
    } catch (_) {
      activeSubscription = null;
    }

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
    throw new Error('Subscription sistemi deaktivdir');
  }

  async getPlanPrices() {
    // Admin service-dən plan məlumatlarını götürürük
    return await adminService.getSubscriptionPlans();
  }

  // Admin methods
  async getAllSubscriptions() {
    try {
      const subscriptions = await executeQuery(`
        SELECT s.id, s.user_id, s.plan, s.price, s.start_date, s.end_date, s.status, s.created_at,
               p.full_name as user_name, u.login as user_email
        FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN user_profiles p ON u.profile_id = p.id
        ORDER BY s.created_at DESC
      `);
      return subscriptions;
    } catch (_) {
      return [];
    }
  }

  async getSubscriptionById(id) {
    try {
      return await getOne(`
        SELECT s.*, p.full_name as user_name, u.login as user_email
        FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN user_profiles p ON u.profile_id = p.id
        WHERE s.id = ?
      `, [id]);
    } catch (_) {
      return null;
    }
  }

  async updateSubscription(id, updateData) {
    try {
      const existing = await getOne('SELECT id FROM subscriptions WHERE id = ?', [id]);
      if (!existing) return null;
      await update('subscriptions', id, updateData);
      return await getOne('SELECT * FROM subscriptions WHERE id = ?', [id]);
    } catch (_) { return null; }
  }

  async deleteSubscription(id) {
    try {
      const existing = await getOne('SELECT id FROM subscriptions WHERE id = ?', [id]);
      if (!existing) return null;
      await executeQuery('DELETE FROM subscriptions WHERE id = ?', [id]);
      return true;
    } catch (_) { return null; }
  }

  async createSubscriptionAdmin(data) {
    throw new Error('Subscription sistemi deaktivdir');
  }
}

export default new SubscriptionService();