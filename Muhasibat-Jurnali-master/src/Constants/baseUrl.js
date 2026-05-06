// src/Constants/baseUrl.js

// Environment-ə görə URL seçimi
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// İstehsal (Production) URL-ləri
const API_BASE_URL = isDevelopment 
  ? "http://localhost:3000/" 
  : "https://api.muhasibatjurnal.az/";

// File Base URL də environment-ə görə dəyişir
const FILE_BASE_URL = isDevelopment 
  ? "http://localhost:3000/" 
  : "https://api.muhasibatjurnal.az/"; // Statik faylların (uploads) ünvanı

// Fayl yolunu tam web URL-ə çevirən funksiya
export const formatServerFilePath = (serverPath) => {
  if (!serverPath) return null;
  
  let webPath = serverPath;
  
  // Windows path'leri handle et (C:\Users\...\uploads\images\... veya C:/Users/.../uploads/images/...)
  if (serverPath.includes('uploads')) {
    const uploadsIndex = serverPath.indexOf('uploads');
    if (uploadsIndex !== -1) {
      // uploads klasöründen sonrasını al (uploads dahil)
      webPath = serverPath.substring(uploadsIndex);
      // Windows backslash'leri forward slash'e çevir
      webPath = webPath.replace(/\\/g, '/');
    }
  } else if (serverPath.includes('/home/muhasibatjurnal/backend-mmu')) {
    // Linux path'leri handle et (/home/muhasibatjurnal/backend-mmu/uploads/...)
    webPath = serverPath.replace('/home/muhasibatjurnal/backend-mmu', '').replace(/\\/g, '/');
  } else {
    // Diğer durumlar için backslash'leri forward slash'e çevir
    webPath = serverPath.replace(/\\/g, '/');
  }
  
  // Path'in / ile başlamasını sağla
  if (!webPath.startsWith('/')) {
    webPath = '/' + webPath;
  }
  
  // File Base URL ilə birləşdirilir
  return `${FILE_BASE_URL.replace(/\/$/, '')}${webPath}`;
};

export default API_BASE_URL;