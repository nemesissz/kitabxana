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
    
    // Real monthly revenue from payments
    let monthlyRevenue = [];
    try {
      monthlyRevenue = await executeQuery(`
        SELECT 
          DATE_FORMAT(created_at, '%b') as month,
          DATE_FORMAT(created_at, '%m') as monthNum,
          COALESCE(SUM(amount), 0) as amount
        FROM payments
        WHERE status = 'completed' OR status = 'success'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%b'), DATE_FORMAT(created_at, '%m')
        ORDER BY DATE_FORMAT(created_at, '%m')
      `);
    } catch (error) {
      console.error('Monthly revenue error:', error);
      monthlyRevenue = [];
    }

    // Fill missing months with 0
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last12Months = [];
    
    // Son 12 ayı oluştur
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = monthNames[date.getMonth()];
      
      const existingData = monthlyRevenue.find(m => m.month === month);
      last12Months.push({
        month,
        amount: existingData ? parseFloat(existingData.amount) : 0
      });
    }

    // Category stats
    const categoryStats = await executeQuery(`
      SELECT 
        c.name,
        COUNT(p.id) as pdfCount,
        COALESCE(SUM(p.downloads), 0) as totalDownloads
      FROM category_pdfs c
      LEFT JOIN pdfs p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY pdfCount DESC
    `);

    // Yeni ətraflı statistikalar
    const detailedStats = await this.getDetailedStats();

    return {
      ...stats,
      monthlyRevenue: last12Months,
      categoryStats,
      ...detailedStats
    };
  }

  async getDetailedStats() {
    // Son 30 gündə yeni istifadəçilər
    const newUsersLast30Days = await getOne(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Son 30 gündə yeni PDF-lər
    const newPdfsLast30Days = await getOne(`
      SELECT COUNT(*) as count FROM pdfs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Son 30 gündə yeni xəbərlər
    const newNewsLast30Days = await getOne(`
      SELECT COUNT(*) as count FROM news 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Aktiv xəbərlərin sayı
    const activeNewsCount = await getOne(`
      SELECT COUNT(*) as count FROM news
    `);

    // Toplam ödənişlər (success status)
    const totalPayments = await getOne(`
      SELECT COUNT(*) as count FROM payments 
      WHERE status = 'success' OR status = 'completed'
    `);

    // Ümumi gəlir (bütün vaxtlar)
    const totalRevenue = await getOne(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE status = 'success' OR status = 'completed'
    `);

    // Bu ayın gəliri
    const thisMonthRevenue = await getOne(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE (status = 'success' OR status = 'completed')
      AND MONTH(created_at) = MONTH(NOW())
      AND YEAR(created_at) = YEAR(NOW())
    `);

    // Keçən ayın gəliri
    const lastMonthRevenue = await getOne(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE (status = 'success' OR status = 'completed')
      AND MONTH(created_at) = MONTH(NOW()) - 1
      AND YEAR(created_at) = YEAR(NOW())
    `);

    // Son 7 gündə gəlir
    const revenueLast7Days = await getOne(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments 
      WHERE (status = 'success' OR status = 'completed')
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Ən çox yüklənən top 5 PDF
    const topPdfs = await executeQuery(`
      SELECT id, title, downloads 
      FROM pdfs 
      ORDER BY downloads DESC 
      LIMIT 5
    `);

    // Aktiv xidmətlərin sayı
    const activeServicesCount = await getOne(`
      SELECT COUNT(*) as count FROM services
    `);

    // Abunə planları bölgüsü (plan əsasında aktiv abunə sayı)
    const subscriptionPlanDistribution = await executeQuery(`
      SELECT 
        s.plan,
        COUNT(*) as count,
        SUM(s.price) as totalRevenue
      FROM subscriptions s
      WHERE s.status = 'active' AND s.plan != 'none'
      GROUP BY s.plan
    `);

    // Son ödənişlər (son 10)
    const recentPayments = await executeQuery(`
      SELECT 
        p.id,
        p.amount,
        p.status,
        p.type,
        p.created_at,
        u.email as user_email,
        pdf.title as pdf_title
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN pdfs pdf ON p.pdf_id = pdf.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    // .edu domaini ilə qeydiyyatdan keçən istifadəçilər
    const eduDomainUsers = await getOne(`
      SELECT COUNT(*) as count FROM users 
      WHERE edu_email LIKE '%.edu%' OR email LIKE '%.edu%'
    `);

    // Son 30 gündə .edu domaini ilə qeydiyyat
    const newEduUsersLast30Days = await getOne(`
      SELECT COUNT(*) as count FROM users 
      WHERE (edu_email LIKE '%.edu%' OR email LIKE '%.edu%')
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    return {
      newUsersLast30Days: newUsersLast30Days.count,
      newPdfsLast30Days: newPdfsLast30Days.count,
      newNewsLast30Days: newNewsLast30Days.count,
      activeNewsCount: activeNewsCount.count,
      totalPayments: totalPayments.count,
      totalRevenue: totalRevenue.total,
      thisMonthRevenue: thisMonthRevenue.total,
      lastMonthRevenue: lastMonthRevenue.total,
      revenueLast7Days: revenueLast7Days.total,
      topPdfs,
      activeServicesCount: activeServicesCount.count,
      subscriptionPlanDistribution,
      recentPayments,
      eduDomainUsers: eduDomainUsers.count,
      newEduUsersLast30Days: newEduUsersLast30Days.count,
      // Gəlir artım faizi (bu ay vs keçən ay)
      revenueGrowthPercent: lastMonthRevenue.total > 0 
        ? ((thisMonthRevenue.total - lastMonthRevenue.total) / lastMonthRevenue.total * 100).toFixed(1)
        : 0
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
  // Memory'de planları sakla (fallback)
  subscriptionPlans = {
    '1m': { 
      price: 9.99, 
      duration: '1 ay',
      plan_name: '1 Aylıq Abunəlik',
      description: '1 aylıq abunəlik',
      durationMonths: 1
    },
    '3m': { 
      price: 24.99, 
      duration: '3 ay',
      plan_name: '3 Aylıq Abunəlik',
      description: '3 aylıq abunəlik',
      durationMonths: 3
    },
    '6m': { 
      price: 39.99, 
      duration: '6 ay',
      plan_name: '6 Aylıq Abunəlik',
      description: '6 aylıq abunəlik',
      durationMonths: 6
    }
  };

  async getSubscriptionPlans() {
    try {
      // Try to get from database first
      const plans = await executeQuery(`
        SELECT plan_code, plan_name, price, duration_months, description 
        FROM subscription_prices 
        WHERE is_active = 1
      `);
      
      if (plans && plans.length > 0) {
        const plansObj = {};
        plans.forEach(plan => {
          plansObj[plan.plan_code] = {
            price: parseFloat(plan.price),
            duration: `${plan.duration_months} ay`,
            plan_name: plan.plan_name,
            description: plan.description,
            durationMonths: plan.duration_months
          };
        });
        return plansObj;
      }
    } catch (error) {
      console.log('subscription_prices tablosu yoxdur, memory-dən istifadə edilir');
    }
    
    // Fallback to memory
    return this.subscriptionPlans;
  }

  async updateSubscriptionPlan(planId, planData) {
    const { price, durationMonths, description, plan_name } = planData;
    
    if (price && price <= 0) {
      throw new Error('Price must be greater than 0');
    }
    
    if (durationMonths && durationMonths <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    // Try to update in database first
    try {
      const updateFields = [];
      const updateValues = [];
      
      if (plan_name !== undefined) {
        updateFields.push('plan_name = ?');
        updateValues.push(plan_name);
      }
      if (price !== undefined) {
        updateFields.push('price = ?');
        updateValues.push(Number(price));
      }
      if (durationMonths !== undefined) {
        updateFields.push('duration_months = ?');
        updateValues.push(Number(durationMonths));
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      
      updateValues.push(planId);
      
      await executeQuery(`
        UPDATE subscription_prices 
        SET ${updateFields.join(', ')} 
        WHERE plan_code = ?
      `, updateValues);
      
      // Return updated plan
      const updatedPlan = await getOne('SELECT * FROM subscription_prices WHERE plan_code = ?', [planId]);
      
      if (updatedPlan) {
        return {
          planId,
          price: parseFloat(updatedPlan.price),
          duration: `${updatedPlan.duration_months} ay`,
          plan_name: updatedPlan.plan_name,
          description: updatedPlan.description,
          durationMonths: updatedPlan.duration_months
        };
      }
    } catch (error) {
      console.log('Database update failed, updating memory');
    }

    // Fallback: Update in memory
    if (!this.subscriptionPlans[planId]) {
      throw new Error('Invalid plan ID');
    }
    
    const plan = this.subscriptionPlans[planId];
    
    if (plan_name !== undefined) plan.plan_name = plan_name;
    if (price !== undefined) plan.price = Number(price);
    if (durationMonths !== undefined) plan.durationMonths = Number(durationMonths);
    if (description !== undefined) plan.description = description;

    return {
      planId,
      ...plan
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

  // PDF Price Management
  async updatePdfPrice(pdfId, price) {
    // Check if PDF exists
    const pdf = await getOne('SELECT id, title, price FROM pdfs WHERE id = ?', [pdfId]);
    if (!pdf) {
      throw new Error('PDF not found');
    }

    // Update PDF price
    await update('pdfs', pdfId, { price: price });

    // Return updated PDF
    return await getOne(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.language,
        p.price,
        p.downloads,
        p.category_id,
        c.name as category_name,
        p.created_at,
        p.updated_at
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      WHERE p.id = ?
    `, [pdfId]);
  }

  async bulkUpdatePdfPrices(updates) {
    const results = {
      success: [],
      failed: []
    };

    for (const update of updates) {
      try {
        const { id, price } = update;
        
        if (!id || price === undefined || price === null) {
          results.failed.push({
            id,
            error: 'Invalid data - id and price required'
          });
          continue;
        }

        const updatedPdf = await this.updatePdfPrice(id, Number(price));
        results.success.push({
          id: updatedPdf.id,
          title: updatedPdf.title,
          oldPrice: update.oldPrice,
          newPrice: updatedPdf.price
        });

      } catch (error) {
        results.failed.push({
          id: update.id,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default new AdminService();