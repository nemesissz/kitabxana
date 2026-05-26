import rentalService from './rental.service.js';

export const createRental = async (req, res, next) => {
  try {
    const { pdf_id, institution_id, duration_days } = req.body;
    if (!pdf_id || !institution_id || !duration_days) {
      return res.status(400).json({ status: 'error', message: 'pdf_id, institution_id və duration_days tələb olunur' });
    }
    const validDurations = [7, 14, 30];
    if (!validDurations.includes(Number(duration_days))) {
      return res.status(400).json({ status: 'error', message: 'Müddət 7, 14 və ya 30 gün olmalıdır' });
    }
    const rental = await rentalService.createRental({
      pdf_id: Number(pdf_id),
      user_id: req.user.id,
      institution_id: Number(institution_id),
      duration_days: Number(duration_days),
    });
    res.status(201).json({ status: 'success', data: { rental } });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const getMyRentals = async (req, res, next) => {
  try {
    const rentals = await rentalService.getMyRentals(req.user.id);
    res.status(200).json({ status: 'success', data: { rentals } });
  } catch (error) {
    next(error);
  }
};

export const getRentals = async (req, res, next) => {
  try {
    const { role, institutionId } = req.user;
    const rentals = role >= 4
      ? await rentalService.getAllRentals()
      : await rentalService.getRentalsForInstitution(institutionId);
    res.status(200).json({ status: 'success', data: { rentals } });
  } catch (error) {
    next(error);
  }
};

export const approveRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    await rentalService.assertCanManage(req.user, Number(id));
    const { start_date } = req.body;
    const rental = await rentalService.approveRental(Number(id), req.user.id, start_date || null);
    res.status(200).json({ status: 'success', data: { rental } });
  } catch (error) {
    if (error.message === 'forbidden') return res.status(403).json({ status: 'error', message: 'Bu sorğunu idarə etmə icazəniz yoxdur' });
    if (error.statusCode) return res.status(error.statusCode).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const rejectRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    await rentalService.assertCanManage(req.user, Number(id));
    const { notes } = req.body;
    const rental = await rentalService.rejectRental(Number(id), req.user.id, notes);
    res.status(200).json({ status: 'success', data: { rental } });
  } catch (error) {
    if (error.message === 'forbidden') return res.status(403).json({ status: 'error', message: 'Bu sorğunu idarə etmə icazəniz yoxdur' });
    if (error.statusCode) return res.status(error.statusCode).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const adminCreateRental = async (req, res, next) => {
  try {
    const { pdf_id, user_id, end_date, notes } = req.body;
    if (!pdf_id || !user_id || !end_date) {
      return res.status(400).json({ status: 'error', message: 'pdf_id, user_id və end_date tələb olunur' });
    }
    const rental = await rentalService.adminCreateRental({
      pdf_id: Number(pdf_id),
      user_id: Number(user_id),
      end_date,
      notes: notes || null,
      admin_id: req.user.id,
    });
    res.status(201).json({ status: 'success', data: { rental } });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ status: 'error', message: error.message });
    next(error);
  }
};

export const markReturned = async (req, res, next) => {
  try {
    const { id } = req.params;
    await rentalService.assertCanManage(req.user, Number(id));
    const rental = await rentalService.markReturned(Number(id), req.user.id);
    res.status(200).json({ status: 'success', data: { rental } });
  } catch (error) {
    if (error.message === 'forbidden') return res.status(403).json({ status: 'error', message: 'Bu sorğunu idarə etmə icazəniz yoxdur' });
    if (error.statusCode) return res.status(error.statusCode).json({ status: 'error', message: error.message });
    next(error);
  }
};
