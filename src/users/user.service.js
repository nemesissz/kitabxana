import { executeQuery, getOne, insert, update, transaction } from '../config/database.js';
import bcrypt from 'bcrypt';

const saltRounds = 10;

class UserService {
  async getAllUsers() {
    const sql = `
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
      ORDER BY u.created_at DESC
    `;
    
    const users = await executeQuery(sql);
    
    // Get subscriptions for each user
    for (const user of users) {
      const subscriptions = await executeQuery(`
        SELECT s.id, s.plan, s.status, s.start_date as startDate, s.end_date as endDate, 
               s.price, s.created_at as createdAt
        FROM subscriptions s
        JOIN user_subscriptions us ON s.id = us.subscription_id
        WHERE us.user_id = ? 
        ORDER BY s.created_at DESC
      `, [user.id]);
      
      // If no subscriptions, return default subscription structure
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
    const { email, password, role = 1, fullName, phone, company } = data;

    // Email-in mövcudluğunu yoxlayırıq
    const existingUser = await getOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // .edu və .edu.az email yoxlaması
    const emailLower = email.toLowerCase();
    const isEduEmail = emailLower.endsWith('.edu') || emailLower.endsWith('.edu.az');

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
        'INSERT INTO users (email, password, role, is_verified, edu_email, profile_id) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, role, false, isEduEmail, profileId]
      );

      // Get created user with profile
      const [users] = await connection.execute(`
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

      return user;
    });
  }

  async findUserById(id) {
    const sql = `
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
      WHERE u.id = ?
    `;
    
    const user = await getOne(sql, [id]);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get subscriptions
    const subscriptions = await executeQuery(`
      SELECT s.id, s.plan, s.status, s.start_date as startDate, s.end_date as endDate, 
             s.price, s.created_at as createdAt
      FROM subscriptions s
      JOIN user_subscriptions us ON s.id = us.subscription_id
      WHERE us.user_id = ? 
      ORDER BY s.created_at DESC
    `, [user.id]);
    
    // If no subscriptions, return default subscription structure
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

    // Get purchased PDFs - həmişə göstər (subscription yoxlama frontend-də olur)
    const purchasedPdfs = await executeQuery(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.file_path as filePath,
        pay.created_at as purchasedAt,
        pay.amount as paidAmount
      FROM payments pay
      JOIN pdfs p ON pay.pdf_id = p.id
      WHERE pay.user_id = ? 
        AND pay.type = 'single-pdf' 
        AND pay.status = 'success'
      ORDER BY pay.created_at DESC
    `, [user.id]);
    
    // PDF URL-ni gizlədək - downloadUrl əlavə edək
    user.purchasedPdfs = (purchasedPdfs || []).map(pdf => ({
      ...pdf,
      downloadUrl: `/pdfs/${pdf.id}/download`
    }));
    
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
          } else if (key === 'eduEmail') {
            dbField = 'edu_email';
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

  async deleteUserById(id) {
    // İstifadəçinin mövcudluğunu yoxlayırıq
    const existingUser = await getOne('SELECT id, profile_id FROM users WHERE id = ?', [id]);

    if (!existingUser) {
      throw new Error('User not found');
    }

    return await transaction(async (connection) => {
      // Delete profile if exists
      if (existingUser.profile_id) {
        await connection.execute('DELETE FROM user_profiles WHERE id = ?', [existingUser.profile_id]);
      }

      // Delete user (CASCADE will handle subscriptions, payments, etc.)
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);

      return { message: 'User successfully deleted' };
    });
  }

  // Check if user has active subscription
  async checkActiveSubscription(userId) {
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
  }

  // Helper method for auth
  async findUserByEmail(email) {
    const sql = `
      SELECT 
        u.id,
        u.email,
        u.password,
        u.role,
        u.is_verified as isVerified,
        u.edu_email as eduEmail,
        p.id as profile_id,
        p.full_name as profile_fullName,
        p.phone as profile_phone,
        p.company as profile_company,
        p.position as profile_position
      FROM users u
      LEFT JOIN user_profiles p ON u.profile_id = p.id
      WHERE u.email = ?
    `;
    
    const user = await getOne(sql, [email]);
    
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