/**
 * Token içindəki istifadəçi rolunun tələb olunan minimum səviyyəyə uyğunluğunu yoxlayır.
 *
 * @param {number|Array} requiredRoles - Tələb olunan rol səviyyəsi və ya rol səviyyələri. 
 *                                        Rəqəm olarsa minimum səviyyə, Array olarsa icazəli rol siyahısı.
 * @returns {function} Express middleware funksiyası.
 */
const roleCheck = (requiredRoles) => (req, res, next) => {
  // `authMiddleware` tərəfindən təyin edilmiş `req.user` obyektini yoxlayır
  if (!req.user || req.user.role === undefined) {
    return res.status(401).json({
      status: 'error',
      message: 'Autentifikasiya uğursuz oldu və ya rol məlumatı yoxdur.'
    });
  }

  const userRole = parseInt(req.user.role, 10);

  // Əgər requiredRoles array-dirsə, istifadəçi rolunun bu array-də olub-olmadığını yoxla
  if (Array.isArray(requiredRoles)) {
    if (requiredRoles.includes(userRole)) {
      return next();
    }
  } else {
    // Əgər requiredRoles rəqəmdirsə, minimum səviyyə kimi istifadə et
    const minimumRole = parseInt(requiredRoles, 10);
    if (userRole >= minimumRole) {
      return next();
    }
  }

  // Tələb olunan səviyyəyə uyğun deyilsə
  return res.status(403).json({
    status: 'error',
    message: 'Bu əməliyyat üçün icazəniz yoxdur. Minimum Admin (səviyyə 2) tələb olunur.'
  });
};

export default roleCheck;