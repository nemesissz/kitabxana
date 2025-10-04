import { executeQuery, getOne, insert, update, transaction } from '../config/database.js';

class AdminService {
  async getStats() {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM pdfs) as totalPdfs,
        (SELECT COUNT(*) FROM news) as totalNews,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as activeSubscriptions,
        (SELECT COUNT(*) FROM subscriptions) as totalSubscriptions,
        (SELECT COALESCE(SUM(downloads), 0) FROM pdfs) as totalDownloads
    `;
    
    const stats = await getOne(sql);
    return stats;
  }

  async getDashboardData() {
    const stats = await this.getStats();
    
    // Monthly revenue (fake data for now)
    const monthlyRevenue = [
      { month: 'Jan', amount: 1500 },
      { month: 'Feb', amount: 2300 },
      { month: 'Mar', amount: 1800 }
    ];

    // Category stats
    const categoryStats = await executeQuery(`
      SELECT 
        c.name,
        COUNT(p.id) as pdfCount,
        COALESCE(SUM(p.downloads), 0) as totalDownloads
      FROM categories c
      LEFT JOIN pdfs p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY pdfCount DESC
    `);

    return {
      ...stats,
      monthlyRevenue,
      categoryStats
    };
  }

  async getAllUsers(filters = {}) {
    let sql = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.is_verified as isVerified,
        u.edu_email as eduEmail,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        p.id as profile_id,
        p.full_name as profile_fullName,
        p.phone as profile_phone,
        p.company as profile_company,
        p.position as profile_position
      FROM users u
      LEFT JOIN user_profiles p ON u.profile_id = p.id
    `;
    
    const conditions = [];
    const params = [];

    if (filters.role) {
      conditions.push('u.role = ?');
      params.push(filters.role);
    }

    if (filters.isVerified !== undefined) {
      conditions.push('u.is_verified = ?');
      params.push(filters.isVerified);
    }

    if (filters.eduEmail !== undefined) {
      conditions.push('u.edu_email = ?');
      params.push(filters.eduEmail);
    }

    if (filters.search) {
      conditions.push('(u.email LIKE ? OR p.full_name LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY u.created_at DESC';

    const users = await executeQuery(sql, params);
    
    // Get subscriptions for each user
    for (const user of users) {
      const subscriptions = await executeQuery(`
        SELECT id, plan, status, start_date as startDate, end_date as endDate, 
               price, created_at as createdAt
        FROM subscriptions 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `, [user.id]);
      
      user.subscriptions = subscriptions;
      user.profile = user.profile_id ? {
        id: user.profile_id,
        fullName: user.profile_fullName,
        phone: user.profile_phone,
        company: user.profile_company,
        position: user.profile_position
      } : null;
      
      // Clean up flat fields
      delete user.profile_id;
      delete user.profile_fullName;
      delete user.profile_phone;
      delete user.profile_company;
      delete user.profile_position;
    }

    return users;
  }

  // Subscription Plan Management
  async getSubscriptionPlans() {
    return {
      '1m': { 
        price: 9.99, 
        duration: '1 ay', 
        description: '1 aylıq abunəlik',
        durationMonths: 1
      },
      '3m': { 
        price: 24.99, 
        duration: '3 ay', 
        description: '3 aylıq abunəlik',
        durationMonths: 3
      },
      '6m': { 
        price: 39.99, 
        duration: '6 ay', 
        description: '6 aylıq abunəlik',
        durationMonths: 6
      }
    };
  }

  async updateSubscriptionPlan(planId, planData) {
    const validPlans = ['1m', '3m', '6m'];
    if (!validPlans.includes(planId)) {
      throw new Error('Invalid plan ID');
    }

    const { price, durationMonths, description } = planData;
    
    if (price <= 0) {
      throw new Error('Price must be greater than 0');
    }
    
    if (durationMonths <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    return {
      planId,
      price,
      durationMonths,
      description,
      updatedAt: new Date()
    };
  }

  async getAllSubscriptions() {
    const subscriptions = await executeQuery(`
      SELECT 
        s.id,
        s.plan,
        s.price,
        s.status,
        s.start_date as startDate,
        s.end_date as endDate,
        s.created_at as createdAt,
        u.id as user_id,
        u.email as user_email,
        p.full_name as user_fullName
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN user_profiles p ON u.profile_id = p.id
      ORDER BY s.created_at DESC
    `);

    return subscriptions.map(sub => ({
      id: sub.id,
      plan: sub.plan,
      price: sub.price,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      createdAt: sub.createdAt,
      user: {
        id: sub.user_id,
        email: sub.user_email,
        profile: sub.user_fullName ? {
          fullName: sub.user_fullName
        } : null
      }
    }));
  }

  async updateUserRole(userId, newRole) {
    // Validate role
    const validRoles = [1, 2, 3]; // 1=User, 2=Admin, 3=Supadmin
    if (!validRoles.includes(parseInt(newRole))) {
      throw new Error('Invalid role. Valid roles: 1=User, 2=Admin, 3=Supadmin');
    }

    // Check if user exists
    const user = await getOne('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user role
    await update('users', userId, { role: parseInt(newRole) });

    // Return updated user
    return await getOne('SELECT id, email, role FROM users WHERE id = ?', [userId]);
  }
}

export default new AdminService();