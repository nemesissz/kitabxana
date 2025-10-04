/**
 * Token içindəki istifadəçi rolunun tələb olunan minimum səviyyəyə uyğunluğunu yoxlayır.
 *
 * @param {number} requiredRole - Tələb olunan minimum rol səviyyəsi (2: Admin, 3: Supadmin).
 * @returns {function} Express middleware funksiyası.
 */
const roleCheck = (requiredRole) => (req, res, next) => {
  // `authMiddleware` tərəfindən təyin edilmiş `req.user` obyektini yoxlayır
  if (!req.user || req.user.role === undefined) {
    return res.status(401).json({
      status: 'error',
      message: 'Autentifikasiya uğursuz oldu və ya rol məlumatı yoxdur.'
    });
  }

  const userRole = parseInt(req.user.role, 10);

  // Əgər istifadəçi rolu tələb olunan rola bərabər və ya ondan yuxarıdırsa
  if (userRole >= requiredRole) {
    return next();
  }

  // Tələb olunan səviyyəyə uyğun deyilsə
  return res.status(403).json({
    status: 'error',
    message: 'Bu əməliyyat üçün icazəniz yoxdur. Minimum Admin (səviyyə 2) tələb olunur.'
  });
};

export default roleCheck;