import { executeQuery, getOne, insert, update, transaction } from '../config/database.js';
import bcrypt from 'bcrypt';
import activityLog from '../activity-logs/activity-log.service.js';

const saltRounds = 10;

class UserService {
  async getAllUsers({ scope = 'global', institutionFilter = null, callerInstId = null } = {}) {
    let sql = `
      SELECT
        u.id,
        u.login,
        u.role,
        u.institution_id as institutionId,
        u.is_verified as isVerified,
        u.upload_permission as uploadPermission,
        u.worker_type as workerType,
        u.category_permission as categoryPermission,
        u.language_permission as languagePermission,
        u.pdf_review_permission as pdfReviewPermission,
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

    if (scope === 'global') {
      if (institutionFilter) {
        conditions.push('u.institution_id = ?');
        params.push(institutionFilter);
      }
    } else if (scope === 'main_worker') {
      // Exclude superadmins
      conditions.push('u.role < 4');
      // Exclude managers from main institutions
      conditions.push(`NOT (u.role >= 3 AND u.institution_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM institutions i2 WHERE i2.id = u.institution_id AND i2.is_main = 1
      ))`);
    } else if (scope === 'nonmain_worker') {
      // Exclude superadmins
      conditions.push('u.role < 4');
      // Only own institution members (role<3) OR users with no institution
      conditions.push('(u.institution_id IS NULL OR (u.institution_id = ? AND u.role < 3))');
      params.push(callerInstId);
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
          SELECT s.id, s.plan, s.status, s.start_date as startDate, s.end_date as endDate,
                 s.price, s.created_at as createdAt
          FROM subscriptions s
          JOIN user_subscriptions us ON s.id = us.subscription_id
          WHERE us.user_id = ?
          ORDER BY s.created_at DESC
        `, [user.id]);
      } catch (_) {
        subscriptions = [];
      }

      if (subscriptions.length === 0) {
        user.subscriptions = [{
          id: null,
          plan: "none",
          status: null,
          startDate: null,
          endDate: null,
          price: null,
          createdAt: null
        }];
      } else {
        user.subscriptions = subscriptions;
      }
      
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

  async createUser(data) {
    const { login, password, role = 1, fullName, phone, company } = data;

    const existingUser = await getOne(
      'SELECT id FROM users WHERE login = ?',
      [login]
    );

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return await transaction(async (connection) => {
      // Create profile first if profile data provided
      let profileId = null;
      if (fullName || phone || company) {
        const [profileResult] = await connection.execute(
          'INSERT INTO user_profiles (full_name, phone, company) VALUES (?, ?, ?)',
          [fullName || null, phone || null, company || null]
        );
        profileId = profileResult.insertId;
      }

      // Create user
      const [userResult] = await connection.execute(
        'INSERT INTO users (login, password, role, is_verified, profile_id) VALUES (?, ?, ?, ?, ?)',
        [login, hashedPassword, role, true, profileId]
      );

      // Get created user with profile
      const [users] = await connection.execute(`
        SELECT
          u.id,
          u.login,
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
        WHERE u.id = ?
      `, [userResult.insertId]);

      const user = users[0];
      if (user.profile_id) {
        user.profile = {
          id: user.profile_id,
          fullName: user.profile_fullName,
          phone: user.profile_phone,
          company: user.profile_company,
          position: user.profile_position
        };
      }

      // Clean up flat fields
      delete user.profile_id;
      delete user.profile_fullName;
      delete user.profile_phone;
      delete user.profile_company;
      delete user.profile_position;

      await activityLog.log({
        eventType: 'user_registered',
        actorEmail: login,
        targetType: 'user',
        targetId: userResult.insertId,
        details: { login },
      });

      return user;
    });
  }

  async findUserById(id) {
    const sql = `
      SELECT
        u.id,
        u.login,
        u.role,
        u.institution_id as institutionId,
        i.name as institutionName,
        u.is_verified as isVerified,
        u.upload_permission as uploadPermission,
        u.worker_type as workerType,
        u.category_permission as categoryPermission,
        u.language_permission as languagePermission,
        u.pdf_review_permission as pdfReviewPermission,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        p.id as profile_id,
        p.full_name as profile_fullName,
        p.phone as profile_phone,
        p.company as profile_company,
        p.position as profile_position
      FROM users u
      LEFT JOIN institutions i ON u.institution_id = i.id
      LEFT JOIN user_profiles p ON u.profile_id = p.id
      WHERE u.id = ?
    `;
    
    const user = await getOne(sql, [id]);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get subscriptions (wrapped in try-catch so missing tables don't break auth)
    let subscriptions = [];
    try {
      subscriptions = await executeQuery(`
        SELECT s.id, s.plan, s.status, s.start_date as startDate, s.end_date as endDate,
               s.price, s.created_at as createdAt
        FROM subscriptions s
        JOIN user_subscriptions us ON s.id = us.subscription_id
        WHERE us.user_id = ?
        ORDER BY s.created_at DESC
      `, [user.id]);
    } catch (_) {
      subscriptions = [];
    }

    if (subscriptions.length === 0) {
      user.subscriptions = [{
        id: null,
        plan: "none",
        status: null,
        startDate: null,
        endDate: null,
        price: null,
        createdAt: null
      }];
    } else {
      user.subscriptions = subscriptions;
    }

    user.purchasedPdfs = [];
    
    if (user.profile_id) {
      user.profile = {
        id: user.profile_id,
        fullName: user.profile_fullName,
        phone: user.profile_phone,
        company: user.profile_company,
        position: user.profile_position
      };
    }
    
    // Clean up flat fields
    delete user.profile_id;
    delete user.profile_fullName;
    delete user.profile_phone;
    delete user.profile_company;
    delete user.profile_position;

    return user;
  }

  async updateUserById(id, data) {
    const { password, fullName, phone, company, role, ...rest } = data;

    // İstifadəçinin mövcudluğunu yoxlayırıq
    const existingUser = await getOne(
      'SELECT id, profile_id FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      throw new Error('User not found');
    }

    return await transaction(async (connection) => {
      // Prepare user update data
      const updateData = { ...rest };
      const updateFields = [];
      const updateValues = [];

      // Handle password hashing
      if (password) {
        updateData.password = await bcrypt.hash(password, saltRounds);
      }

      // Add role if provided
      if (role !== undefined) {
        updateData.role = role;
      }

      // Build dynamic update query for users table
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          // Map camelCase to snake_case for database
          let dbField = key;
          if (key === 'isVerified') {
            dbField = 'is_verified';
          }
          
          updateFields.push(`${dbField} = ?`);
          updateValues.push(updateData[key]);
        }
      });

      // Update user if there are fields to update
      if (updateFields.length > 0) {
        updateValues.push(id);
        await connection.execute(
          `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          updateValues
        );
      }

      // Handle profile updates
      if (fullName !== undefined || phone !== undefined || company !== undefined) {
        const profileData = {};
        if (fullName !== undefined) profileData.full_name = fullName;
        if (phone !== undefined) profileData.phone = phone;
        if (company !== undefined) profileData.company = company;

        if (existingUser.profile_id) {
          // Update existing profile
          const profileFields = [];
          const profileValues = [];
          
          Object.keys(profileData).forEach(key => {
            profileFields.push(`${key} = ?`);
            profileValues.push(profileData[key]);
          });
          
          if (profileFields.length > 0) {
            profileValues.push(existingUser.profile_id);
            await connection.execute(
              `UPDATE user_profiles SET ${profileFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
              profileValues
            );
          }
        } else {
          // Create new profile
          const [profileResult] = await connection.execute(
            'INSERT INTO user_profiles (full_name, phone, company) VALUES (?, ?, ?)',
            [profileData.full_name || null, profileData.phone || null, profileData.company || null]
          );
          
          // Link profile to user
          await connection.execute(
            'UPDATE users SET profile_id = ? WHERE id = ?',
            [profileResult.insertId, id]
          );
        }
      }

      // Return updated user
      return await this.findUserById(id);
    });
  }

  async deleteUserById(id, deletedByEmail = null) {
    const existingUser = await getOne('SELECT id, login, profile_id FROM users WHERE id = ?', [id]);

    if (!existingUser) {
      throw new Error('User not found');
    }

    await activityLog.log({
      eventType: 'user_deleted',
      actorEmail: deletedByEmail,
      targetType: 'user',
      targetId: id,
      details: { login: existingUser.login },
    });

    return await transaction(async (connection) => {
      if (existingUser.profile_id) {
        await connection.execute('DELETE FROM user_profiles WHERE id = ?', [existingUser.profile_id]);
      }
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      return { message: 'User successfully deleted' };
    });
  }

  // Check if user has active subscription
  async checkActiveSubscription(userId) {
    try {
      const subscription = await getOne(`
        SELECT s.*
        FROM subscriptions s
        WHERE s.user_id = ?
          AND s.status = 'active'
          AND s.end_date > NOW()
          AND s.plan != 'none'
        ORDER BY s.end_date DESC
        LIMIT 1
      `, [userId]);
      return !!subscription;
    } catch (_) {
      return false;
    }
  }

  // Helper method for auth
  async updatePermissions(userId, { category_permission, language_permission, pdf_review_permission, upload_permission, worker_type }) {
    const existing = await getOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existing) throw new Error('User not found');
    const updates = {};
    if (category_permission !== undefined) updates.category_permission = category_permission;
    if (language_permission !== undefined) updates.language_permission = language_permission;
    if (pdf_review_permission !== undefined) updates.pdf_review_permission = pdf_review_permission;
    if (upload_permission !== undefined) updates.upload_permission = upload_permission;
    if (worker_type !== undefined) updates.worker_type = worker_type;
    if (Object.keys(updates).length === 0) return this.findUserById(userId);
    await update('users', userId, updates);
    return this.findUserById(userId);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await getOne('SELECT id, password FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('User not found');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw new Error('Cari şifrə yanlışdır');

    const hashed = await bcrypt.hash(newPassword, saltRounds);
    await executeQuery('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
  }

  async findUserByLogin(login) {
    const sql = `
      SELECT
        u.id,
        u.login,
        u.password,
        u.role,
        u.is_verified as isVerified,
        p.id as profile_id,
        p.full_name as profile_fullName,
        p.phone as profile_phone,
        p.company as profile_company,
        p.position as profile_position
      FROM users u
      LEFT JOIN user_profiles p ON u.profile_id = p.id
      WHERE u.login = ?
    `;

    const user = await getOne(sql, [login]);
    
    if (!user) {
      return null;
    }

    if (user.profile_id) {
      user.profile = {
        id: user.profile_id,
        fullName: user.profile_fullName,
        phone: user.profile_phone,
        company: user.profile_company,
        position: user.profile_position
      };
    }
    
    // Clean up flat fields
    delete user.profile_id;
    delete user.profile_fullName;
    delete user.profile_phone;
    delete user.profile_company;
    delete user.profile_position;

    return user;
  }
}

export default new UserService();