import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class CategoryService {
  async getAllCategories() {
    return await executeQuery('SELECT * FROM categories ORDER BY name');
  }

  async getCategoryById(id) {
    return await getOne('SELECT * FROM categories WHERE id = ?', [id]);
  }

  async createCategory(data) {
    const { name, description } = data;
    
    // Check if category exists
    const existing = await getOne('SELECT id FROM categories WHERE name = ?', [name]);
    if (existing) {
      throw new Error('Category already exists');
    }

    const categoryId = await insert('categories', { name, description });
    return await this.getCategoryById(categoryId);
  }

  async updateCategory(id, data) {
    const { name, description } = data;
    
    // Check if category exists
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('Category not found');
    }

    // Check for duplicate name
    if (name) {
      const duplicate = await getOne('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
      if (duplicate) {
        throw new Error('Category name already exists');
      }
    }

    await update('categories', id, { name, description });
    return await this.getCategoryById(id);
  }

  async deleteCategory(id) {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('Category not found');
    }

    await deleteRecord('categories', id);
    return { message: 'Category deleted successfully' };
  }
}
            language: true,
            price: true,
            downloads: true,
            createdAt: true
          }
        }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async createCategory(data) {
    const { name } = data;

    // Check if category already exists (case-sensitive for MySQL)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name
      }
    });

    if (existingCategory) {
      throw new Error('Category already exists');
    }

    const category = await prisma.category.create({
      data: { name }
    });

    return category;
  }

  async updateCategory(id, data) {
    const { name } = data;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: Number(id) }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if new name already exists
    if (name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: name,
          id: {
            not: Number(id)
          }
        }
      });

      if (existingCategory) {
        throw new Error('Category name already exists');
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: { name }
    });

    return updatedCategory;
  }

  async deleteCategory(id) {
    // Check if category has PDFs
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            pdfs: true
          }
        }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category._count.pdfs > 0) {
      throw new Error('Cannot delete category with existing PDFs');
    }

    await prisma.category.delete({
      where: { id: Number(id) }
    });

    return true;
  }
}

export default new CategoryService();