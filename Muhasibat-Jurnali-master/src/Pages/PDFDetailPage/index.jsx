import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Base_Url_Server, { formatServerFilePath } from '../../Constants/baseUrl';
import styles from './index.module.scss';
import { downloadPdf } from '../../Services/pdfService';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AdSpace from '../../Components/AdSpace';
import dataContext from '../../Contexts/GlobalState';
import Swal from 'sweetalert2';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const PDFDetailPage = () => {
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showToc, setShowToc] = useState(false);
  const [rentalModal, setRentalModal] = useState(false);
  const [rentalDuration, setRentalDuration] = useState(14);
  const [rentalLoading, setRentalLoading] = useState(false);
  const [previewNumPages, setPreviewNumPages] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const isLoggedIn = !!store?.user?.data;

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarix yoxdur';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tarix yoxdur';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return 'Tarix yoxdur';
    }
  };

  useEffect(() => {
    if (!id) { setError('PDF ID-si tapılmadı'); setLoading(false); return; }
    const fetchPdf = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(Base_Url_Server + `pdfs/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        const pdfData = response.data?.data?.pdf;
        if (pdfData) {
          setPdf(pdfData);
        } else {
          setError('PDF məlumatları tapılmadı');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'PDF yüklənərkən xəta baş verdi');
      } finally {
        setLoading(false);
      }
    };
    fetchPdf();
  }, [id]);

  // Touch swipe handlers
  const minSwipeDistance = 50;
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !pdf?.content_images_paths) return;
    const distance = touchStart - touchEnd;
    const len = pdf.content_images_paths.length;
    if (distance > minSwipeDistance) setCurrentImageIndex(p => p === len - 1 ? 0 : p + 1);
    if (distance < -minSwipeDistance) setCurrentImageIndex(p => p === 0 ? len - 1 : p - 1);
  };

  const catName = (pdf?.category?.name || '').toLowerCase();
  const isFiziki    = catName.includes('kitab-fiziki');
  const isElektron  = catName.includes('kitab-elektron');
  const isHerIkisi  = catName.includes('kitab-hər ikisi') || catName.includes('kitab-her ikisi');
  const isPhysical  = isFiziki || isHerIkisi;
  const showPreview = (isElektron || isHerIkisi) && !!pdf?.file_path;

  const handleRent = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (!pdf?.institution_id) {
      alert('Bu kitab üçün müəssisə məlumatı mövcud deyil.');
      return;
    }
    try {
      setRentalLoading(true);
      await axios.post(Base_Url_Server + 'rentals', {
        pdf_id: pdf.id,
        institution_id: pdf.institution_id,
        duration_days: rentalDuration,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setRentalModal(false);
      alert(`Kirayə sorğunuz göndərildi! Müəssisə tərəfindən təsdiqləndikdən sonra bildiriş alacaqsınız.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setRentalLoading(false);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem('token');
    try {
      setDownloading(true);
      const blob = await downloadPdf(id, token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdf.title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      const res = await axios.get(Base_Url_Server + `pdfs/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (res.data?.data?.pdf) setPdf(res.data.data.pdf);
    } catch (err) {
      alert(err.response?.data?.message || 'PDF yüklənərkən xəta baş verdi.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
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
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroImage}>
          {pdf.cover_image_path || pdf.image_path ? (
            <img
              src={formatServerFilePath(pdf.cover_image_path || pdf.image_path)}
              alt={pdf.title}
              onError={(e) => { e.target.src = '/src/Assets/heroImage.jpg'; }}
            />
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#fff', fontSize:'18px', backgroundColor:'rgba(0,0,0,0.3)' }}>
              Şəkil yoxdur
            </div>
          )}
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbLink} onClick={() => navigate('/')}>Ana səhifə</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbLink} onClick={() => navigate('/library')}>Kitabxana</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>PDF</span>
            </div>
            <h1>{pdf.title}</h1>
            <div className={styles.heroMeta}>
              {pdf.language && <span className={styles.language}>{pdf.language}</span>}
              {pdf.category?.name && <span className={styles.category}>{pdf.category.name}</span>}
              <span className={styles.date}>{formatDate(pdf.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Sol tərəf: Mündericat + Təsvir */}
          <div className={styles.pdfContent}>
            {(pdf.table_of_contents || (pdf.content_images_paths && pdf.content_images_paths.length > 0)) && (
              <div className={styles.contentImagesSlider}>
                <h3>
                  Mündericat
                  {pdf.table_of_contents && (
                    <button
                      onClick={() => setShowToc(v => !v)}
                      style={{ marginLeft: '12px', fontSize: '13px', padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: showToc ? '#e0e7ff' : '#032062', color: showToc ? '#032062' : '#fff', fontWeight: '500' }}
                    >
                      {showToc ? 'Gizlət' : 'Mündericatı gör'}
                    </button>
                  )}
                </h3>

                {/* Mətn mündericatı */}
                {pdf.table_of_contents && showToc && (
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.8', margin: '0 0 16px 0', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                    {pdf.table_of_contents}
                  </pre>
                )}

                {/* Şəkil slider */}
                {pdf.content_images_paths && pdf.content_images_paths.length > 0 && (
                  <div className={styles.sliderContainer}>
                    <button className={styles.sliderArrow}
                      onClick={() => setCurrentImageIndex(p => p === 0 ? pdf.content_images_paths.length - 1 : p - 1)}
                      aria-label="Əvvəlki şəkil">
                      <ArrowBackIosIcon />
                    </button>
                    <div className={styles.sliderImageContainer}
                      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                      <img
                        src={formatServerFilePath(pdf.content_images_paths[currentImageIndex])}
                        alt={`Mündericat ${currentImageIndex + 1}`}
                        onError={(e) => { e.target.src = '/src/Assets/heroImage.jpg'; }}
                        draggable={false}
                      />
                      <div className={styles.sliderIndicators}>
                        {pdf.content_images_paths.map((_, i) => (
                          <button key={i}
                            className={`${styles.indicator} ${i === currentImageIndex ? styles.active : ''}`}
                            onClick={() => setCurrentImageIndex(i)}
                            aria-label={`Şəkil ${i + 1}`} />
                        ))}
                      </div>
                      <div className={styles.sliderCounter}>
                        {currentImageIndex + 1} / {pdf.content_images_paths.length}
                      </div>
                    </div>
                    <button className={styles.sliderArrow}
                      onClick={() => setCurrentImageIndex(p => p === pdf.content_images_paths.length - 1 ? 0 : p + 1)}
                      aria-label="Növbəti şəkil">
                      <ArrowForwardIosIcon />
                    </button>
                  </div>
                )}
              </div>
            )}

            {pdf.description && (
              <div className={styles.description}>
                <h3>Təsvir</h3>
                <p>{pdf.description}</p>
              </div>
            )}

            {showPreview && (
              <div className={styles.previewSection}>
                <h3 className={styles.previewTitle}>📄 Önizləmə</h3>
                <div className={styles.previewWrap}>
                  <Document
                    file={formatServerFilePath(pdf.file_path)}
                    onLoadSuccess={({ numPages }) => setPreviewNumPages(numPages)}
                    loading={<div className={styles.previewLoading}><CircularProgress size={28} /><span>Yüklənir...</span></div>}
                    error={<p className={styles.previewError}>PDF önizləməsi mövcud deyil.</p>}
                  >
                    {[1, 2, 3].filter(p => !previewNumPages || p <= previewNumPages).map(pageNum => (
                      <div key={pageNum} className={styles.previewPage}>
                        <Page
                          pageNumber={pageNum}
                          width={560}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </div>
                    ))}
                  </Document>
                  <div className={styles.previewFade}>
                    <button
                      className={styles.previewReadBtn}
                      onClick={() => window.open(`/library/${id}/read`, '_blank')}
                    >
                      📖 Tam oxu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sağ tərəf: PDF məlumatları + Yüklə düyməsi */}
          <div className={styles.sidebar}>
            <AdSpace position="detail-sidebar" />
            <div className={styles.pdfInfo}>
              <h3>PDF Məlumatları</h3>
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
              {pdf.author && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Müəllif:</span>
                  <span className={styles.infoValue}>{pdf.author}</span>
                </div>
              )}
              {pdf.publication_year && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nəşr tarixi:</span>
                  <span className={styles.infoValue}>{pdf.publication_year}</span>
                </div>
              )}
              {pdf.publisher_location && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Nəşriyyat yeri:</span>
                  <span className={styles.infoValue}>{pdf.publisher_location}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Qiymət:</span>
                <span className={styles.infoValue}>
                  {pdf.price > 0 ? `${pdf.price} AZN` : "Pulsuz"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tarix:</span>
                <span className={styles.infoValue}>{formatDate(pdf.created_at)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Yüklənmə sayı:</span>
                <span className={styles.infoValue}>{pdf.downloads || 0}</span>
              </div>
              {pdf.institution?.name && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Kitabxana:</span>
                  <span className={styles.infoValue}>{pdf.institution.name}</span>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              {!isFiziki && (
                <button
                  className={styles.downloadButton}
                  onClick={() => window.open(`/library/${pdf.id}/read`, '_blank')}
                  style={{ marginBottom: '8px' }}
                >
                  📖 Oxu
                </button>
              )}
              {!isFiziki && pdf.allow_download !== 0 && (
                <button
                  className={styles.buyButton}
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{ marginBottom: '8px' }}
                >
                  {downloading ? <CircularProgress size={20} style={{ color: '#fff' }} /> : '📥 Yüklə'}
                </button>
              )}
              {isPhysical && (
                <button
                  className={`${styles.rentButton} ${!isLoggedIn ? styles.rentButtonGuest : ''}`}
                  onClick={() => {
                    if (!isLoggedIn) {
                      Swal.fire({
                        icon: 'info',
                        title: 'Giriş tələb olunur',
                        text: 'Kitab kirayələmək üçün hesabınıza daxil olun.',
                        confirmButtonText: 'Daxil ol',
                        showCancelButton: true,
                        cancelButtonText: 'Ləğv et',
                        confirmButtonColor: '#2c3e50',
                      }).then(r => { if (r.isConfirmed) navigate('/login'); });
                      return;
                    }
                    setRentalModal(true);
                  }}
                >
                  📚 Kirayələ
                </button>
              )}
            </div>

            {/* Kirayə modal */}
            {rentalModal && (
              <div className={styles.rentalOverlay} onClick={() => setRentalModal(false)}>
                <div className={styles.rentalModal} onClick={e => e.stopPropagation()}>
                  <h3>Kitab Kirayəsi</h3>
                  <p className={styles.rentalBook}>{pdf.title}</p>
                  {pdf.institution?.name && (
                    <p className={styles.rentalInst}>📍 {pdf.institution.name}</p>
                  )}
                  <p className={styles.rentalLabel}>Kirayə müddəti seçin:</p>
                  <div className={styles.durationBtns}>
                    {[7, 14, 30].map(d => (
                      <button
                        key={d}
                        className={`${styles.durationBtn} ${rentalDuration === d ? styles.durationActive : ''}`}
                        onClick={() => setRentalDuration(d)}
                      >
                        {d} gün
                      </button>
                    ))}
                  </div>
                  <div className={styles.rentalActions}>
                    <button className={styles.rentalCancel} onClick={() => setRentalModal(false)}>Ləğv et</button>
                    <button className={styles.rentalConfirm} onClick={handleRent} disabled={rentalLoading}>
                      {rentalLoading ? <CircularProgress size={16} style={{ color: '#fff' }} /> : 'Sorğu Göndər'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFDetailPage;
