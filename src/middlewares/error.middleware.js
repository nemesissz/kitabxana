export const errorHandler = (err, req, res, next) => {
  // JSON parse error handling
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Yanlış JSON formatı göndərildi'
    });
  }

  // Multer error handling
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      status: 'error',
      message: 'Fayl ölçüsü 10MB-dan çox ola bilməz'
    });
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Verilənlərin validasiyası uğursuz oldu'
    });
  }

  // Default error response
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Daxili server xətası'
  });
};