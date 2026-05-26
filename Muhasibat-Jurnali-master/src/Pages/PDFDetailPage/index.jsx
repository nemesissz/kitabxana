import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Base_Url_Server, { formatServerFilePath } from '../../Constants/baseUrl';
import styles from './index.module.scss';
import { downloadPdf } from '../../Services/pdfService';
import dataContext from '../../Contexts/GlobalState';
import Swal from 'sweetalert2';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import BookCover from '../../Components/BookCover';
import Footer from '../../Layouts/Footer';
import { displayCategoryName } from '../../Constants/categoryDisplay';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const PALETTES = [
  ["#3D2914","#7A4A26"],
  ["#1F3A2E","#3A6B53"],
  ["#8B1A1A","#C0392B"],
  ["#1A2B4A","#3E5B8B"],
  ["#0B4F6C","#0F7895"],
  ["#5B3A1F","#8E6840"],
  ["#2D1B4E","#5A3D8A"],
  ["#1B3A1B","#2E7D32"],
];

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
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const isLoggedIn = !!store?.user?.data;

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarix yoxdur';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tarix yoxdur';
      return `${date.getDate().toString().padStart(2,'0')}.${(date.getMonth()+1).toString().padStart(2,'0')}.${date.getFullYear()}`;
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
          setIsFavorited(!!pdfData.is_favorited);
          document.title = pdfData.title + ' — MMU Kitabxana';
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

  const typeName = (pdf?.pdf_type?.name || '').toLowerCase();
  const isHerIkisi = typeName.includes('ikisi');
  const isFiziki   = typeName.includes('fiziki') && !isHerIkisi;
  const isElektron = typeName.includes('elektron') && !isHerIkisi;
  const isPhysical = isFiziki || isHerIkisi;
  const showPreview = (isElektron || isHerIkisi) && !!pdf?.file_path;

  const totalCopies    = parseInt(pdf?.quantity) || 1;
  const activeRentals  = parseInt(pdf?.active_rentals_count) || 0;
  const availableCopies = isPhysical ? Math.max(0, totalCopies - activeRentals) : null;
  const fullyRented    = isPhysical && availableCopies === 0;

  const handleRent = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (!pdf?.institution_id) {
      Swal.fire({ icon: 'warning', title: 'Məlumat yoxdur', text: 'Bu kitab üçün müəssisə məlumatı mövcud deyil.', confirmButtonColor: '#0B1F3D' });
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
      Swal.fire({ icon: 'success', title: 'Sorğu göndərildi', text: 'Müəssisə tərəfindən təsdiqləndikdən sonra bildiriş alacaqsınız.', confirmButtonColor: '#0B1F3D' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Xəta', text: err.response?.data?.message || 'Xəta baş verdi', confirmButtonColor: '#0B1F3D' });
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
      Swal.fire({ icon: 'error', title: 'Xəta', text: err.response?.data?.message || 'PDF yüklənərkən xəta baş verdi.', confirmButtonColor: '#0B1F3D' });
    } finally {
      setDownloading(false);
    }
  };

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'info', title: 'Giriş tələb olunur',
        text: 'Favorilərə əlavə etmək üçün hesabınıza daxil olun.',
        confirmButtonText: 'Daxil ol', showCancelButton: true,
        cancelButtonText: 'Ləğv et', confirmButtonColor: '#0B1F3D',
      }).then(r => { if (r.isConfirmed) navigate('/login'); });
      return;
    }
    setFavLoading(true);
    try {
      const res = await axios.post(
        Base_Url_Server + `pdfs/${id}/favorite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFavorited(res.data.favorited);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Xəta', text: err.response?.data?.message || 'Xəta baş verdi', confirmButtonColor: '#0B1F3D' });
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) return (
    <div className={styles.stateWrap}>
      <div className={styles.spinner} />
      <p>Yüklənir…</p>
    </div>
  );

  if (error || !pdf) return (
    <div className={styles.stateWrap}>
      <h2>Xəta</h2>
      <p>{error || 'PDF tapılmadı'}</p>
      <button className="mmu-btn mmu-btn-primary" onClick={() => navigate(-1)}>Geri</button>
    </div>
  );

  const [heroC1, heroC2] = PALETTES[(pdf?.category?.id || pdf?.id || 0) % PALETTES.length];

  return (
    <>
      <main>
        {/* ── Hero ── */}
        <section className={styles.hero} style={{ background: `linear-gradient(150deg, ${heroC1} 0%, ${heroC2} 100%)` }}>
          <div className="mmu-container">
            <nav className={styles.crumb}>
              <button onClick={() => navigate('/')}>Ana səhifə</button>
              <span>/</span>
              <button onClick={() => navigate('/library/all')}>Kitabxana</button>
              <span>/</span>
              <span>{pdf.title}</span>
            </nav>

            <div className={styles.heroBody}>
              <div className={styles.heroCover}>
                <BookCover pdf={pdf} />
              </div>

              <div className={styles.heroInfo}>
                <div className={styles.heroBadges}>
                  {pdf.category?.name && (
                    <span className="mmu-badge mmu-badge-accent">{displayCategoryName(pdf.category.name)}</span>
                  )}
                  {pdf.language && (
                    <span className={styles.langBadge}>{pdf.language}</span>
                  )}
                </div>
                <h1 className={styles.heroTitle}>{pdf.title}</h1>
                {pdf.author && <p className={styles.heroAuthor}>{pdf.author}</p>}
                <div className={styles.heroMeta}>
                  {pdf.publication_year && <span>{pdf.publication_year}</span>}
                  {!isFiziki && <span>↓ {pdf.downloads || 0} yüklənmə</span>}
                  <span>{formatDate(pdf.created_at)}</span>
                </div>
                {isPhysical && (
                  <div className={styles.availabilityBadge} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    marginTop: 8, padding: '4px 10px', borderRadius: 20,
                    fontSize: 13, fontWeight: 600,
                    background: fullyRented ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)',
                    color: fullyRented ? '#fca5a5' : '#86efac',
                    border: `1px solid ${fullyRented ? 'rgba(220,38,38,0.35)' : 'rgba(22,163,74,0.35)'}`,
                  }}>
                    {fullyRented
                      ? `Bütün nüsxələr kirayədədir (0/${totalCopies})`
                      : `${availableCopies}/${totalCopies} nüsxə mövcuddur`
                    }
                  </div>
                )}

                <div className={styles.heroActions}>
                  {!isFiziki && (
                    <button
                      className={styles.btnWhite}
                      onClick={() => window.open(`/library/${pdf.id}/read`, '_blank')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      Oxu
                    </button>
                  )}
                  {!isFiziki && pdf.allow_download !== 0 && (
                    <button
                      className={styles.btnAccent}
                      onClick={handleDownload}
                      disabled={downloading}
                    >
                      {downloading ? <span className={styles.btnSpinnerSm} /> : (
                        <>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Yüklə
                        </>
                      )}
                    </button>
                  )}
                  {isPhysical && (
                    <button
                      className={styles.btnOutlineWhite}
                      disabled={fullyRented}
                      style={fullyRented ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                      onClick={() => {
                        if (fullyRented) return;
                        if (!isLoggedIn) {
                          Swal.fire({
                            icon: 'info', title: 'Giriş tələb olunur',
                            text: 'Kitab kirayələmək üçün hesabınıza daxil olun.',
                            confirmButtonText: 'Daxil ol', showCancelButton: true,
                            cancelButtonText: 'Ləğv et', confirmButtonColor: '#0B1F3D',
                          }).then(r => { if (r.isConfirmed) navigate('/login'); });
                          return;
                        }
                        setRentalModal(true);
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>
                      {fullyRented ? 'Kirayədədir' : 'Kirayələ'}
                    </button>
                  )}
                  <button
                    className={styles.btnFav}
                    onClick={handleToggleFavorite}
                    disabled={favLoading}
                    title={isFavorited ? 'Favorilərdən çıxar' : 'Favorilərə əlavə et'}
                  >
                    <svg
                      width="16" height="16" viewBox="0 0 24 24"
                      fill={isFavorited ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {isFavorited ? 'Favoridədir' : 'Favorilərə əlavə et'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Body ── */}
        <section className={styles.body}>
          <div className="mmu-container">
            <div className={styles.layout}>

              {/* Main content */}
              <div className={styles.mainCol}>

                {/* TOC + image slider */}
                {(pdf.table_of_contents || (pdf.content_images_paths && pdf.content_images_paths.length > 0)) && (
                  <div className={styles.section}>
                    <div className={styles.sectionHead}>
                      <h3>Mündericat</h3>
                      {pdf.table_of_contents && (
                        <button
                          className="mmu-btn mmu-btn-outline mmu-btn-sm"
                          onClick={() => setShowToc(v => !v)}
                        >
                          {showToc ? 'Gizlət' : 'Mündericatı gör'}
                        </button>
                      )}
                    </div>

                    {pdf.table_of_contents && showToc && (
                      <pre className={styles.tocText}>{pdf.table_of_contents}</pre>
                    )}

                    {pdf.content_images_paths && pdf.content_images_paths.length > 0 && (
                      <div className={styles.slider}>
                        <button
                          className={styles.sliderArrow}
                          onClick={() => setCurrentImageIndex(p => p === 0 ? pdf.content_images_paths.length - 1 : p - 1)}
                          aria-label="Əvvəlki şəkil"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <div
                          className={styles.sliderWrap}
                          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                        >
                          <img
                            src={formatServerFilePath(pdf.content_images_paths[currentImageIndex])}
                            alt={`Mündericat ${currentImageIndex + 1}`}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            draggable={false}
                          />
                          <div className={styles.sliderDots}>
                            {pdf.content_images_paths.map((_, i) => (
                              <button
                                key={i}
                                className={`${styles.dot} ${i === currentImageIndex ? styles.dotActive : ''}`}
                                onClick={() => setCurrentImageIndex(i)}
                                aria-label={`Şəkil ${i + 1}`}
                              />
                            ))}
                          </div>
                          <span className={styles.sliderCount}>{currentImageIndex + 1} / {pdf.content_images_paths.length}</span>
                        </div>
                        <button
                          className={styles.sliderArrow}
                          onClick={() => setCurrentImageIndex(p => p === pdf.content_images_paths.length - 1 ? 0 : p + 1)}
                          aria-label="Növbəti şəkil"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {pdf.description && (
                  <div className={styles.section}>
                    <div className={styles.sectionHead}><h3>Təsvir</h3></div>
                    <p className={styles.descText}>{pdf.description}</p>
                  </div>
                )}

                {/* PDF Preview */}
                {showPreview && (
                  <div className={styles.section}>
                    <div className={styles.sectionHead}><h3>Önizləmə</h3></div>
                    <div className={styles.previewWrap}>
                      <Document
                        file={formatServerFilePath(pdf.file_path)}
                        onLoadSuccess={({ numPages }) => setPreviewNumPages(numPages)}
                        loading={<div className={styles.previewLoading}><div className={styles.spinner} /><span>Yüklənir…</span></div>}
                        error={<p className={styles.previewError}>PDF önizləməsi mövcud deyil.</p>}
                      >
                        {[1, 2, 3].filter(p => !previewNumPages || p <= previewNumPages).map(pageNum => (
                          <div key={pageNum} className={styles.previewPage}>
                            <Page pageNumber={pageNum} width={560} renderTextLayer={false} renderAnnotationLayer={false} />
                          </div>
                        ))}
                      </Document>
                      <div className={styles.previewFade}>
                        <button
                          className="mmu-btn mmu-btn-primary"
                          onClick={() => window.open(`/library/${id}/read`, '_blank')}
                        >
                          Tam oxu
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className={styles.aside}>
                <div className={styles.infoCard}>
                  <h4>Məlumat</h4>
                  {[
                    { l: 'Başlıq',    v: pdf.title },
                    { l: 'Kateqoriya', v: pdf.category?.name },
                    { l: 'Müəllif',   v: pdf.author },
                    { l: 'Dil',       v: pdf.language },
                    { l: 'Nəşr ili',  v: pdf.publication_year },
                    { l: 'Nəşr yeri', v: pdf.publisher_location },
                    { l: 'Qiymət',    v: pdf.price > 0 ? `${pdf.price} AZN` : 'Pulsuz' },
                    { l: 'Tarix',     v: formatDate(pdf.created_at) },
                    { l: 'Yüklənmə', v: !isFiziki ? (pdf.downloads || 0) : null },
                    { l: 'Ümumi nüsxə', v: isPhysical ? totalCopies : null },
                    { l: 'Mövcud nüsxə', v: isPhysical ? availableCopies : null },
                    { l: 'Kitabxana', v: pdf.institution?.name },
                  ].filter(item => item.v != null && item.v !== '').map(({ l, v }) => (
                    <div key={l} className={styles.infoRow}>
                      <span className={styles.infoKey}>{l}</span>
                      <span className={styles.infoVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      {/* ── Rental modal ── */}
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
                {rentalLoading ? <span className={styles.btnSpinnerSm} /> : 'Sorğu Göndər'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default PDFDetailPage;
