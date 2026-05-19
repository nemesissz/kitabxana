import { executeQuery, getOne, insert, update, transaction } from '../config/database.js';
import sessionService from '../sessions/session.service.js';

class AdminService {
  async getStats(institutionId = null) {
    const safe = async (fn) => { try { return await fn(); } catch (_) { return null; } };

    const instFilter = institutionId
      ? 'uploaded_by IN (SELECT id FROM users WHERE institution_id = ?)'
      : null;
    const p = institutionId ? [institutionId] : [];

    const [totalUsers, totalPdfs, approvedPdfs, pendingPdfs, rejectedPdfs, totalNews, totalDownloads] =
      await Promise.all([
        safe(() => getOne(
          institutionId
            ? 'SELECT COUNT(*) as v FROM users WHERE institution_id = ?'
            : 'SELECT COUNT(*) as v FROM users',
          p
        )),
        safe(() => getOne(
          institutionId
            ? `SELECT COUNT(*) as v FROM pdfs WHERE ${instFilter}`
            : 'SELECT COUNT(*) as v FROM pdfs',
          p
        )),
        safe(() => getOne(
          institutionId
            ? `SELECT COUNT(*) as v FROM pdfs WHERE status = 'approved' AND ${instFilter}`
            : "SELECT COUNT(*) as v FROM pdfs WHERE status = 'approved'",
          p
        )),
        safe(() => getOne(
          institutionId
            ? `SELECT COUNT(*) as v FROM pdfs WHERE status = 'pending' AND ${instFilter}`
            : "SELECT COUNT(*) as v FROM pdfs WHERE status = 'pending'",
          p
        )),
        safe(() => getOne(
          institutionId
            ? "SELECT COUNT(*) as v FROM activity_logs WHERE event_type = 'pdf_rejected' AND JSON_EXTRACT(details, '$.uploader_institution_id') = ?"
            : "SELECT COUNT(*) as v FROM activity_logs WHERE event_type = 'pdf_rejected'",
          p
        )),
        safe(() => getOne('SELECT COUNT(*) as v FROM news', [])),
        safe(() => getOne(
          institutionId
            ? `SELECT COALESCE(SUM(downloads), 0) as v FROM pdfs WHERE ${instFilter}`
            : 'SELECT COALESCE(SUM(downloads), 0) as v FROM pdfs',
          p
        )),
      ]);

    return {
      totalUsers:     Number(totalUsers?.v)     || 0,
      totalPdfs:      Number(totalPdfs?.v)      || 0,
      approvedPdfs:   Number(approvedPdfs?.v)   || 0,
      pendingPdfs:    Number(pendingPdfs?.v)     || 0,
      rejectedPdfs:   Number(rejectedPdfs?.v)   || 0,
      totalNews:      Number(totalNews?.v)       || 0,
      totalDownloads: Number(totalDownloads?.v)  || 0,
    };
  }

  async getDashboardData(institutionId = null) {
    const stats = await this.getStats(institutionId);

    let categoryStats = [];
    try {
      if (institutionId) {
        categoryStats = await executeQuery(`
          SELECT c.name, COUNT(p.id) as pdfCount,
            COALESCE(SUM(p.downloads), 0) as totalDownloads,
            COALESCE(SUM(p.\`reads\`), 0) as totalReads
          FROM category_pdfs c
          LEFT JOIN pdfs p ON c.id = p.category_id
            AND p.uploaded_by IN (SELECT id FROM users WHERE institution_id = ?)
          GROUP BY c.id, c.name ORDER BY pdfCount DESC
        `, [institutionId]);
      } else {
        categoryStats = await executeQuery(`
          SELECT c.name, COUNT(p.id) as pdfCount,
            COALESCE(SUM(p.downloads), 0) as totalDownloads,
            COALESCE(SUM(p.\`reads\`), 0) as totalReads
          FROM category_pdfs c
          LEFT JOIN pdfs p ON c.id = p.category_id
          GROUP BY c.id, c.name ORDER BY pdfCount DESC
        `);
      }
    } catch (_) {
      categoryStats = [];
    }

    const detailedStats = await this.getDetailedStats(institutionId);

    return {
      ...stats,
      categoryStats,
      ...detailedStats
    };
  }

  async getDetailedStats(institutionId = null) {
    const instFilter = institutionId ? 'AND institution_id = ?' : '';
    const pdfInstFilter = institutionId
      ? 'AND uploaded_by IN (SELECT id FROM users WHERE institution_id = ?)'
      : '';
    const p = institutionId ? [institutionId] : [];

    const safe = async (fn) => { try { return await fn(); } catch (_) { return null; } };

    const newUsersLast30Days = await safe(() => getOne(
      `SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ${instFilter}`, p
    ));

    const newPdfsLast30Days = await safe(() => getOne(
      `SELECT COUNT(*) as count FROM pdfs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ${pdfInstFilter}`, p
    ));

    const newNewsLast30Days = await safe(() => getOne(
      `SELECT COUNT(*) as count FROM news WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    ));

    const activeNewsCount = await safe(() => getOne(`SELECT COUNT(*) as count FROM news`));

    const topPdfs = await safe(() => executeQuery(
      `SELECT id, title, downloads FROM pdfs ${institutionId ? 'WHERE uploaded_by IN (SELECT id FROM users WHERE institution_id = ?)' : ''} ORDER BY downloads DESC LIMIT 5`, p
    )) || [];

    const topUploaders = await safe(() => executeQuery(
      `SELECT u.login, COUNT(p.id) as pdfCount
       FROM users u JOIN pdfs p ON u.id = p.uploaded_by
       ${institutionId ? 'WHERE u.institution_id = ?' : ''}
       GROUP BY u.id, u.login ORDER BY pdfCount DESC LIMIT 10`, p
    )) || [];

    const topByReads = await safe(() => executeQuery(
      `SELECT id, title, \`reads\` FROM pdfs ${institutionId ? 'WHERE uploaded_by IN (SELECT id FROM users WHERE institution_id = ?)' : ''} ORDER BY \`reads\` DESC LIMIT 5`, p
    )) || [];

    const timeStats = await sessionService.getTimeStats();

    return {
      newUsersLast30Days: newUsersLast30Days?.count ?? 0,
      newPdfsLast30Days:  newPdfsLast30Days?.count  ?? 0,
      newNewsLast30Days:  newNewsLast30Days?.count   ?? 0,
      activeNewsCount:    activeNewsCount?.count     ?? 0,
      topPdfs,
      topByReads,
      topUploaders,
      totalSeconds:  Number(timeStats.totalSeconds)  || 0,
      totalSessions: Number(timeStats.totalSessions) || 0,
      anonSessions:  Number(timeStats.anonSessions)  || 0,
      uniqueUsers:   Number(timeStats.uniqueUsers)   || 0,
      topByTime:     timeStats.topByTime             || [],
      todayStats:    timeStats.today                 || { totalSeconds: 0, totalSessions: 0, anonSessions: 0, uniqueUsers: 0 },
      monthStats:    timeStats.thisMonth             || { totalSeconds: 0, totalSessions: 0, anonSessions: 0, uniqueUsers: 0 },
      dailyChart:    timeStats.dailyChart            || [],
    };
  }

  async getAllUsers(filters = {}) {
    let sql = `
      SELECT
        u.id,
        u.role,
        u.is_verified as isVerified,
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

    if (filters.search) {
      conditions.push('(u.login LIKE ? OR p.full_name LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY u.created_at DESC';

    const users = await executeQuery(sql, params);
    
    // Get subscriptions for each user
    for (const user of users) {
      let subscriptions = [];
      try {
        subscriptions = await executeQuery(`
          SELECT id, plan, status, start_date as startDate, end_date as endDate,
                 price, created_at as createdAt
          FROM subscriptions
          WHERE user_id = ?
          ORDER BY created_at DESC
        `, [user.id]);
      } catch (_) {
        subscriptions = [];
      }

      user.subscriptions = subscriptions.length > 0 ? subscriptions : [{ id: null, plan: 'none', status: null, startDate: null, endDate: null, price: null, createdAt: null }];
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
    let subscriptions = [];
    try {
      subscriptions = await executeQuery(`
        SELECT
          s.id, s.plan, s.price, s.status,
          s.start_date as startDate, s.end_date as endDate, s.created_at as createdAt,
          u.id as user_id, u.login as user_login,
          p.full_name as user_fullName
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN user_profiles p ON u.profile_id = p.id
        ORDER BY s.created_at DESC
      `);
    } catch (_) {
      return [];
    }

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
    const user = await getOne('SELECT id, login, role FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user role
    await update('users', userId, { role: parseInt(newRole) });

    // Return updated user
    return await getOne('SELECT id, login, role FROM users WHERE id = ?', [userId]);
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
        l.code AS language, l.name AS language_name, l.flag AS language_flag,
        p.price,
        p.downloads,
        p.category_id,
        c.name as category_name,
        p.created_at,
        p.updated_at
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      LEFT JOIN languages l ON p.language_id = l.id
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