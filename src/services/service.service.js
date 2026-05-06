import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class ServiceService {
  async getAllServices(filters = {}) {
    const { isActive, minPrice, maxPrice, search } = filters;
    
    let whereClause = '';
    const queryParams = [];
    const conditions = [];

    if (isActive !== undefined) {
      conditions.push('is_active = ?');
      queryParams.push(isActive);
    }

    if (minPrice !== undefined) {
      conditions.push('price >= ?');
      queryParams.push(minPrice);
    }

    if (maxPrice !== undefined) {
      conditions.push('price <= ?');
      queryParams.push(maxPrice);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const query = `SELECT * FROM services ${whereClause} ORDER BY created_at DESC`;
    return await executeQuery(query, queryParams);
  }

  async getServiceById(id) {
    return await getOne('SELECT * FROM services WHERE id = ?', [id]);
  }

  async createService(data) {
    const { name, description, price, currency = 'AZN', isActive = true } = data;
    
    if (!name || price === undefined || price === null || price < 0) {
      throw new Error('Name is required and price must be a non-negative number');
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new Error('Price must be a valid non-negative number');
    }

    // Check if service already exists
    const existing = await getOne('SELECT id FROM services WHERE name = ?', [name]);
    if (existing) {
      throw new Error('Service with this name already exists');
    }

    const serviceData = {
      name,
      description,
      price: parsedPrice,
      currency,
      is_active: isActive
    };

    const serviceId = await insert('services', serviceData);
    return await this.getServiceById(serviceId);
  }

  async updateService(id, data) {
    const { name, description, price, currency, isActive } = data;
    
    // Check if service exists
    const existing = await this.getServiceById(id);
    if (!existing) {
      throw new Error('Service not found');
    }

    // Check for duplicate name
    if (name && name !== existing.name) {
      const duplicate = await getOne('SELECT id FROM services WHERE name = ? AND id != ?', [name, id]);
      if (duplicate) {
        throw new Error('Service name already exists');
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (currency !== undefined) updateData.currency = currency;
    if (isActive !== undefined) updateData.is_active = isActive;

    await update('services', id, updateData);
    return await this.getServiceById(id);
  }

  async deleteService(id) {
    // Check if service exists
    const existing = await this.getServiceById(id);
    if (!existing) {
      throw new Error('Service not found');
    }

    await deleteRecord('services', id);
    return { message: 'Service deleted successfully' };
  }

  async getActiveServices() {
    return await executeQuery('SELECT * FROM services WHERE is_active = true ORDER BY price');
  }

  async getServicesPreview(limit = 5, isActive = null) {
    // Ensure limit is integer and within bounds
    limit = parseInt(limit) || 5;
    if (limit > 20) limit = 20;
    if (limit < 1) limit = 5;
    
    // Build WHERE clause for active filter
    let whereClause = '';
    const queryParams = [];
    
    if (isActive !== null && isActive !== undefined) {
      whereClause = 'WHERE is_active = ?';
      queryParams.push(isActive);
    }
    
    const query = `
      SELECT 
        id,
        name,
        description,
        price,
        currency,
        is_active,
        created_at,
        updated_at
      FROM services
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    
    return await executeQuery(query, queryParams);
  }
}

export default new ServiceService();