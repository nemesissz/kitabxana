import paymentService from './payment.service.js';

export const createPayment = async (req, res, next) => {
  try {
    const { type, amount, pdfId, plan } = req.body;
    const userId = req.user.id;

    if (!['subscription', 'single-pdf'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment type'
      });
    }

    if (type === 'single-pdf' && !pdfId) {
      return res.status(400).json({
        status: 'error',
        message: 'PDF ID is required for single-pdf payments'
      });
    }
    
    if (type === 'subscription' && !plan) {
      return res.status(400).json({
        status: 'error',
        message: 'Subscription plan is required for subscription payments'
      });
    }

    const payment = await paymentService.createPayment(userId, type, amount, pdfId, plan);

    res.status(201).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(Number(id));

    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    if (error.message === 'Payment not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const getUserPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payments = await paymentService.getUserPayments(userId);

    res.status(200).json({
      status: 'success',
      data: {
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const { data, signature } = req.body;
    
    if (!data || !signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing data or signature'
      });
    }

    const payment = await paymentService.handlePaymentWebhook({ data, signature });

    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    next(error);
  }
};