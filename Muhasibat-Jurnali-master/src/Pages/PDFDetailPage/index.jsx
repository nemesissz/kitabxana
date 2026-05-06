import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Base_Url_Server, { formatServerFilePath } from '../../Constants/baseUrl';
import styles from './index.module.scss';
import { checkPdfAccess, downloadPdf } from '../../Services/pdfService';
import { initiateCheckout } from '../../Services/paymentService';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AdSpace from '../../Components/AdSpace';

const PDFDetailPage = () => {
  // YENI BUILD - Build tarixini yoxlamaq üçün
  const BUILD_VERSION = '2.1';
  const BUILD_TIMESTAMP = '2026-01-20 20:30:00';
  console.log('%c🚀 YENI BUILD - PDF Detail Page v' + BUILD_VERSION, 'color: #032062; font-size: 18px; font-weight: bold; background: #e0e7ff; padding: 15px; border-radius: 8px; border: 2px solid #032062;');
  console.log('%c📅 Build tarixi:', 'color: #1e3a8a; font-weight: bold; font-size: 14px;', BUILD_TIMESTAMP);
  console.log('%c🔄 Cache busting timestamp:', 'color: #e74c3c; font-weight: bold;', Date.now());
  console.log('%c✅ Yükləmə düyməsi aktivdir!', 'color: #27ae60; font-weight: bold; font-size: 14px;');
  
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarix yoxdur';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tarix yoxdur';
      
      // gün.ay.il formatında (dd.mm.yyyy)
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.error('Date formatlaşdırması xətası:', error);
      return 'Tarix yoxdur';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true);
        console.log('Fetching PDF with ID:', id);
        const token = localStorage.getItem('token');
        const response = await axios.get(Base_Url_Server + `pdfs/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        console.log('PDF API response:', response.data);
        
        // API response structure: {status: "success", data: {pdf: {...}}}
        const pdfData = response.data?.data?.pdf;
        console.log('Parsed PDF data:', pdfData);
        
        if (pdfData) {
          setPdf(pdfData);
          // Backend-dən gələn hasAccess məlumatını istifadə et
          console.log('📄 PDF hasAccess from backend:', pdfData.hasAccess);
          console.log('📄 PDF accessType from backend:', pdfData.accessType);
          console.log('📄 PDF downloadUrl from backend:', pdfData.downloadUrl);
          console.log('📄 Current hasAccess state before update:', hasAccess);
          
          // Backend-dən hasAccess gəlibsə, onu istifadə et
          if (pdfData.hasAccess !== undefined) {
            const newHasAccess = Boolean(pdfData.hasAccess);
            console.log('🔄 Setting hasAccess to:', newHasAccess);
            setHasAccess(newHasAccess);
            setCheckingAccess(false);
            console.log('✅ hasAccess set from backend to:', newHasAccess);
          } else if (token) {
            // Əgər backend-dən hasAccess gəlməyibsə və token varsa, ayrıca yoxla
            console.log('⚠️ hasAccess undefined from backend, checking separately...');
            checkAccess();
          } else {
            console.log('⚠️ No token and no hasAccess from backend, setting to false');
            setHasAccess(false);
            setCheckingAccess(false);
          }
        } else {
          setError('PDF məlumatları tapılmadı');
        }
      } catch (error) {
        console.error('PDF yüklenirkən xəta:', error);
        if (error.response) {
          setError(`API xətası: ${error.response.status} - ${error.response.data?.message || error.message}`);
        } else {
          setError('Şəbəkə xətası: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPdf();
    } else {
      setError('PDF ID-si tapılmadı');
      setLoading(false);
    }
  }, [id]);

  // PDF data dəyişdikdə hasAccess-i yenilə
  useEffect(() => {
    if (pdf && pdf.hasAccess !== undefined) {
      console.log('🔄 PDF data changed, updating hasAccess from:', hasAccess, 'to:', pdf.hasAccess);
      setHasAccess(Boolean(pdf.hasAccess));
      setCheckingAccess(false);
    }
  }, [pdf]);

  // PDF erişim kontrolü (yalnız backend-dən hasAccess gəlməyibsə)
  const checkAccess = React.useCallback(async () => {
    if (!id) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    try {
      setCheckingAccess(true);
      console.log('🔍 Checking access separately for PDF:', id);
      const response = await checkPdfAccess(id, token);
      console.log('🔍 Access check response:', response);
      const hasAccessValue = response?.data?.hasAccess || response?.data?.data?.hasAccess || false;
      setHasAccess(hasAccessValue);
      console.log('✅ Access check result:', hasAccessValue);
    } catch (error) {
      console.error('❌ Erişim kontrolü xətası:', error);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  }, [id]);

  // Onlayn baxış/yükləmə funksiyaları deaktiv edildiyi üçün, əlaqəli handlerlər silinib

  // Touch event handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && pdf?.content_images_paths) {
      // Swipe left - next image
      setCurrentImageIndex((prev) => 
        prev === pdf.content_images_paths.length - 1 ? 0 : prev + 1
      );
    }
    
    if (isRightSwipe && pdf?.content_images_paths) {
      // Swipe right - previous image
      setCurrentImageIndex((prev) => 
        prev === 0 ? pdf.content_images_paths.length - 1 : prev - 1
      );
    }
  };

  // Tek PDF satın alma
  const handleBuyPdf = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setCheckoutLoading(true);
      // İndirimli fiyat varsa onu kullan, yoxsa normal fiyatı kullan
      const finalPrice = pdf?.priceInfo?.hasDiscount 
        ? pdf.priceInfo.discountedPrice 
        : pdf?.price || 0;
      
      const data = {
        type: 'single-pdf',
        pdfId: id,
        amount: finalPrice
      };
      
      const response = await initiateCheckout(data, token);
      
      if (response?.data?.payment?.paymentUrl) {
        window.location.href = response.data.payment.paymentUrl;
      } else {
        throw new Error('Ödəniş URL-i alınmadı');
      }
    } catch (error) {
      console.error('Ödəniş xətası:', error);
      
      // Daha detaylı hata mesajı
      let errorMessage = 'Ödəniş zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
      
      if (error.response) {
        if (error.response.status === 429) {
          errorMessage = 'Çox sayda cəhd edildi. Zəhmət olmasa bir müddət sonra yenidən cəhd edin.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setCheckoutLoading(false);
    }
  };

  // Abonelik satın alma
  const handleSubscribe = () => {
    navigate('/subscriptions');
  };

  // PDF yükləmə
  const handleDownloadPdf = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!hasAccess) {
      alert('PDF-ə girişiniz yoxdur. Zəhmət olmasa əvvəlcə PDF-i alın və ya abunə olun.');
      return;
    }

    try {
      setDownloading(true);
      const blob = await downloadPdf(id, token);
      
      // Blob-u fayl kimi yüklə
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdf.title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // PDF məlumatlarını yenilə (downloads sayını artırmaq üçün)
      const response = await axios.get(Base_Url_Server + `pdfs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.data?.pdf) {
        setPdf(response.data.data.pdf);
      }
    } catch (error) {
      console.error('PDF yükləmə xətası:', error);
      let errorMessage = 'PDF yüklənərkən xəta baş verdi.';
      
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'PDF-ə giriş rədd edildi. Zəhmət olmasa əvvəlcə PDF-i alın və ya abunə olun.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  if (loading || checkingAccess) {
    return (
      <div className={styles.pdfDetailPage}>
        <div className={styles.loading}>
          <CircularProgress />
          <p>Yüklənir...</p>
        </div>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className={styles.pdfDetailPage}>
        <div className={styles.error}>
          <h2>Xəta</h2>
          <p>{error || 'PDF tapılmadı'}</p>
          
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pdfDetailPage}>
      <div className={styles.hero}>
        <div className={styles.heroImage}>
          {pdf.cover_image_path || pdf.image_path ? (
            <img 
              src={formatServerFilePath(pdf.cover_image_path || pdf.image_path) || '/src/Assets/heroImage.jpg'} 
              alt={pdf.title}
              onError={(e) => {
                e.target.src = '/src/Assets/heroImage.jpg'; // Fallback image
              }}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#fff',
              fontSize: '18px',
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)'
            }}>
              Şəkil yoxdur
            </div>
          )}
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.breadcrumb}>
              <span 
                className={styles.breadcrumbLink}
                onClick={() => navigate('/')}
              >
                Ana səhifə
              </span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span 
                className={styles.breadcrumbLink}
                onClick={() => navigate('/')}
              >
                Kitabxana
              </span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>PDF</span>
            </div>
            <h1>{pdf.title}</h1>
            <div className={styles.heroMeta}>
              {pdf.language && (
                <span className={styles.language}>{pdf.language}</span>
              )}
              {pdf.category?.name && (
                <span className={styles.category}>{pdf.category.name}</span>
              )}
              <span className={styles.date}>
                {formatDate(pdf.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.pdfContent}>
            {/* Mündericat Sekilleri Slider */}
            {pdf.content_images_paths && Array.isArray(pdf.content_images_paths) && pdf.content_images_paths.length > 0 ? (
              <div className={styles.contentImagesSlider}>
                <h3>Mündericat</h3>
                <div className={styles.sliderContainer}>
                  <button
                    className={styles.sliderArrow}
                    onClick={() => setCurrentImageIndex((prev) => 
                      prev === 0 ? pdf.content_images_paths.length - 1 : prev - 1
                    )}
                    aria-label="Əvvəlki şəkil"
                  >
                    <ArrowBackIosIcon />
                  </button>
                  <div 
                    className={styles.sliderImageContainer}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <img
                      src={formatServerFilePath(pdf.content_images_paths[currentImageIndex])}
                      alt={`Mündericat ${currentImageIndex + 1}`}
                      onError={(e) => {
                        e.target.src = '/src/Assets/heroImage.jpg';
                      }}
                      draggable={false}
                    />
                    <div className={styles.sliderIndicators}>
                      {pdf.content_images_paths.map((_, index) => (
                        <button
                          key={index}
                          className={`${styles.indicator} ${
                            index === currentImageIndex ? styles.active : ''
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                          aria-label={`Şəkil ${index + 1}`}
                        />
                      ))}
                    </div>
                    <div className={styles.sliderCounter}>
                      {currentImageIndex + 1} / {pdf.content_images_paths.length}
                    </div>
                  </div>
                  <button
                    className={styles.sliderArrow}
                    onClick={() => setCurrentImageIndex((prev) => 
                      prev === pdf.content_images_paths.length - 1 ? 0 : prev + 1
                    )}
                    aria-label="Növbəti şəkil"
                  >
                    <ArrowForwardIosIcon />
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.contentImagesSlider}>
                <h3>Mündericat</h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '40px',
                  color: '#666',
                  fontSize: '16px',
                  textAlign: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  Mündericat şəkilləri yoxdur
                </div>
              </div>
            )}

            {pdf.description && (
              <div className={styles.description}>
                <h3>Təsvir</h3>
                <p>{pdf.description}</p>
              </div>
            )}
          </div>

          <div className={styles.sidebar}>
            <AdSpace position="detail-sidebar" />
            <div className={styles.pdfInfo}>
              <h3>PDF Məlumatları :</h3>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Başlıq:</span>
                <span className={styles.infoValue}>{pdf.title}</span>
              </div>
              {pdf.category?.name && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Kateqoriya:</span>
                  <span className={styles.infoValue}>{pdf.category.name}</span>
                </div>
              )}
              {pdf.language && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Dil:</span>
                  <span className={styles.infoValue}>{pdf.language}</span>
                </div>
              )}
              {pdf.file_size && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Fayl ölçüsü:</span>
                  <span className={styles.infoValue}>{formatFileSize(pdf.file_size)}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tarix:</span>
                <span className={styles.infoValue}>{formatDate(pdf.created_at)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Yüklənmə sayı:</span>
                <span className={styles.infoValue}>{pdf.downloads || 0}</span>
              </div>
              {!hasAccess && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Qiymət:</span>
                  <span className={styles.infoValue}>
                    {pdf.priceInfo?.hasDiscount ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '1em', color: '#6b7280' }}>
                            {pdf.priceInfo.originalPrice} AZN
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.3em' }}>
                            {pdf.priceInfo.discountedPrice.toFixed(2)} AZN
                          </span>
                          <span style={{ 
                            fontSize: '0.85em', 
                            color: '#fff', 
                            backgroundColor: '#27ae60',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            {pdf.priceInfo.discountPercent}% endirim
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75em', color: '#27ae60', fontWeight: '500' }}>
                          Tələbə endirimi
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{pdf.price} AZN</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              {(() => {
                console.log('🎯 Render check - hasAccess:', hasAccess, 'pdf.hasAccess:', pdf?.hasAccess);
                return null;
              })()}
              {!hasAccess ? (
                <>
                  <button 
                    className={styles.buyButton}
                    onClick={handleBuyPdf}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? 'Yüklənir...' : `PDF-i al - ${pdf.priceInfo?.hasDiscount ? pdf.priceInfo.discountedPrice.toFixed(2) : pdf.price} AZN`}
                  </button>
                  <button 
                    className={styles.subscribeButton}
                    onClick={handleSubscribe}
                  >
                    Abunə ol və bütün PDF-lərə giriş əldə et
                  </button>
                </>
              ) : (
                <div className={styles.accessNotice}>
                  <h4>✅ PDF əldə olunub</h4>
                  <p>
                    Bu PDF artıq hesabınıza əlavə edilib. Aşağıdakı düymə ilə PDF-i yükləyə bilərsiniz.
                  </p>
                  <button 
                    className={styles.downloadButton}
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                  >
                    {downloading ? 'Yüklənir...' : '📥 PDF-i Yüklə'}
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFDetailPage;