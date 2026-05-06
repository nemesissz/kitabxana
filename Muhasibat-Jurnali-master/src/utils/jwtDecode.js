/**
 * JWT token-u decode edir
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token və ya null
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode xətası:', error);
    return null;
  }
};

/**
 * Token-dən user məlumatlarını alır
 * @param {string} token - JWT token
 * @returns {Object|null} User data və ya null
 */
export const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    id: decoded.id || decoded.userId,
    email: decoded.email,
    role: decoded.role,
    hasActiveSubscription: decoded.hasActiveSubscription || false
  };
};

