import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';
import fs from 'fs/promises';
import { join } from 'path';

class PdfService {
  async createPdf(data, file) {
    const { title, language, price, categoryId } = data;

    const pdf = await prisma.pdf.create({
      data: {
        title,
        language,
        price: Number(price),
        categoryId: Number(categoryId),
        filePath: file.path,
        downloads: 0
      }
    });

    return pdf;
  }

  async getAllPdfs(filters = {}) {
    const { categoryId, language, search, minPrice, maxPrice, sortBy, sortOrder = 'desc' } = filters;

    const where = {};
    if (categoryId) {
      where.categoryId = Number(categoryId);
    }
    if (language) {
      where.language = language;
    }
    if (search) {
      where.OR = [
        {
          title: {
            contains: search
          }
        },
        {
          category: {
            name: {
              contains: search
            }
          }
        }
      ];
    }
    if (minPrice !== undefined) {
      where.price = {
        ...where.price,
        gte: Number(minPrice)
      };
    }
    if (maxPrice !== undefined) {
      where.price = {
        ...where.price,
        lte: Number(maxPrice)
      };
    }

    // Sıralama seçenekləri
    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const pdfs = await prisma.pdf.findMany({
      where,
      include: {
        category: true
      },
      orderBy
    });

    return pdfs;
  }

  async getPdfById(id) {
    const pdf = await prisma.pdf.findUnique({
      where: { id: Number(id) },
      include: {
        category: true
      }
    });

    if (!pdf) {
      throw new Error('PDF not found');
    }

    return pdf;
  }

  async updatePdf(id, data) {
    const { title, language, price, categoryId } = data;

    const pdf = await prisma.pdf.update({
      where: { id: Number(id) },
      data: {
        title,
        language,
        price: price ? Number(price) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined
      }
    });

    return pdf;
  }

  async deletePdf(id) {
    const pdf = await this.getPdfById(id);

    // Əvvəlcə faylı silirik
    try {
      await fs.unlink(pdf.filePath);
    } catch (error) {
      console.error('Error deleting PDF file:', error);
    }

    // Sonra bazadan silək
    await prisma.pdf.delete({
      where: { id: Number(id) }
    });

    return true;
  }

  async incrementDownloads(id) {
    const pdf = await prisma.pdf.update({
      where: { id: Number(id) },
      data: {
        downloads: {
          increment: 1
        }
      }
    });

    return pdf;
  }

  async downloadPdf(id, userId) {
    const pdf = await this.getPdfById(id);

    // Kullanıcının aktif bir aboneliği var mı kontrol et
    const hasActiveSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: {
          gt: new Date()
        }
      }
    });

    // Pulsuz PDF-lər və ya aktiv abunəliyi olan istifadəçilər yükləyə bilər
    if (pdf.price === 0 || hasActiveSubscription) {
      // Yükləmə sayını artıraq
      await this.incrementDownloads(id);
      return pdf.filePath;
    }

    // Ödənişli PDF üçün abunəlik tələb olunur
    throw new Error('Bu PDF-i yükləmək üçün aktiv abunəlik tələb olunur');
  }
}

export default new PdfService();