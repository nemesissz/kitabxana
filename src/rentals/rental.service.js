import { executeQuery, getOne, insert } from '../config/database.js';

class RentalService {
  async createRental({ pdf_id, user_id, institution_id, duration_days }) {
    const pdf = await getOne('SELECT id, institution_id FROM pdfs WHERE id = ?', [pdf_id]);
    if (!pdf) throw Object.assign(new Error('PDF tapılmadı'), { statusCode: 404 });

    const existing = await getOne(
      `SELECT id FROM book_rentals WHERE pdf_id = ? AND user_id = ? AND status = 'pending'`,
      [pdf_id, user_id]
    );
    if (existing) throw Object.assign(new Error('Bu kitab üçün artıq gözləyən sorğunuz var'), { statusCode: 409 });

    const rentalId = await insert('book_rentals', {
      pdf_id,
      user_id,
      institution_id,
      duration_days,
      status: 'pending',
    });

    return await this._getRentalById(rentalId);
  }

  async _getRentalById(id) {
    return await getOne(
      `SELECT r.*, p.title AS pdf_title, u.login AS user_email, u.login AS user_login,
              i.name AS institution_name
       FROM book_rentals r
       JOIN pdfs p ON r.pdf_id = p.id
       JOIN users u ON r.user_id = u.id
       JOIN institutions i ON r.institution_id = i.id
       WHERE r.id = ?`,
      [id]
    );
  }

  async getRentalsForInstitution(institutionId) {
    return await executeQuery(
      `SELECT r.*, p.title AS pdf_title, u.login AS user_email, u.login AS user_login,
              i.name AS institution_name
       FROM book_rentals r
       JOIN pdfs p ON r.pdf_id = p.id
       JOIN users u ON r.user_id = u.id
       JOIN institutions i ON r.institution_id = i.id
       WHERE r.institution_id = ?
       ORDER BY r.created_at DESC`,
      [institutionId]
    );
  }

  async getAllRentals() {
    return await executeQuery(
      `SELECT r.*, p.title AS pdf_title, u.login AS user_email, u.login AS user_login,
              i.name AS institution_name
       FROM book_rentals r
       JOIN pdfs p ON r.pdf_id = p.id
       JOIN users u ON r.user_id = u.id
       JOIN institutions i ON r.institution_id = i.id
       ORDER BY r.created_at DESC`
    );
  }

  async getMyRentals(userId) {
    return await executeQuery(
      `SELECT r.*, p.title AS pdf_title, i.name AS institution_name
       FROM book_rentals r
       JOIN pdfs p ON r.pdf_id = p.id
       JOIN institutions i ON r.institution_id = i.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
  }

  async approveRental(rentalId, reviewerId, startDate) {
    const rental = await this._getRentalById(rentalId);
    if (!rental) throw Object.assign(new Error('Sorğu tapılmadı'), { statusCode: 404 });
    if (rental.status !== 'pending') throw Object.assign(new Error('Yalnız gözləyən sorğular təsdiqlənə bilər'), { statusCode: 400 });

    const start = startDate || new Date().toISOString().split('T')[0];
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + rental.duration_days);
    const end = endDate.toISOString().split('T')[0];

    await executeQuery(
      `UPDATE book_rentals SET status='approved', start_date=?, end_date=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?`,
      [start, end, reviewerId, rentalId]
    );
    return await this._getRentalById(rentalId);
  }

  async rejectRental(rentalId, reviewerId, notes) {
    const rental = await this._getRentalById(rentalId);
    if (!rental) throw Object.assign(new Error('Sorğu tapılmadı'), { statusCode: 404 });
    if (rental.status !== 'pending') throw Object.assign(new Error('Yalnız gözləyən sorğular rədd edilə bilər'), { statusCode: 400 });

    await executeQuery(
      `UPDATE book_rentals SET status='rejected', notes=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?`,
      [notes || null, reviewerId, rentalId]
    );
    return await this._getRentalById(rentalId);
  }

  async markReturned(rentalId, reviewerId) {
    const rental = await this._getRentalById(rentalId);
    if (!rental) throw Object.assign(new Error('Sorğu tapılmadı'), { statusCode: 404 });
    if (rental.status !== 'approved') throw Object.assign(new Error('Yalnız təsdiqlənmiş kitablar qaytarıla bilər'), { statusCode: 400 });

    await executeQuery(
      `UPDATE book_rentals SET status='returned', reviewed_by=?, reviewed_at=NOW() WHERE id=?`,
      [reviewerId, rentalId]
    );
    return await this._getRentalById(rentalId);
  }

  async assertCanManage(user, rentalId) {
    const { role, institutionId } = user;
    if (role >= 4) return;
    const rental = await getOne('SELECT institution_id FROM book_rentals WHERE id = ?', [rentalId]);
    if (!rental) throw Object.assign(new Error('Sorğu tapılmadı'), { statusCode: 404 });
    if (Number(rental.institution_id) !== Number(institutionId)) {
      throw Object.assign(new Error('forbidden'), { statusCode: 403 });
    }
  }
}

export default new RentalService();
