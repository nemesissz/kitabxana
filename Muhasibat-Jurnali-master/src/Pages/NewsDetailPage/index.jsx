import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Base_Url_Server from '../../Constants/baseUrl';
import styles from './index.module.scss';
import AdSpace from '../../Components/AdSpace';

const NewsDetailPage = () => {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Image URL formatlaşdırması üçün helper funksiya
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return '/src/Assets/heroImage.jpg';
    
    // Server path-i web URL-ə çevir
    const webPath = imagePath.replace('/home/muhasibatjurnal/backend-mmu', '');
    return `https://api.muhasibatjurnal.az${webPath}`;
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        console.log('Fetching news with ID:', id);
        console.log('API URL:', Base_Url_Server + `news/${id}`);
        
        const response = await axios.get(Base_Url_Server + `news/${id}`);
        console.log('Full API response:', response);
        console.log('Response data:', response.data);
        
        // API response structure: {status: "success", data: {news: {...}}}
        const newsData = response.data?.data?.news;
        console.log('Parsed news data:', newsData);
        
        if (newsData) {
          setNews(newsData);
        } else {
          console.error('No news data found in response');
          setError('Xəbər məlumatları tapılmadı');
        }
      } catch (error) {
        console.error('API Error details:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        
        if (error.response) {
          console.error('Error status:', error.response.status);
          console.error('Error data:', error.response.data);
          setError(`API xətası: ${error.response.status} - ${error.response.data?.message || error.message}`);
        } else {
          setError('Şəbəkə xətası: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNews();
    } else {
      setError('Xəbər ID-si tapılmadı');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className={styles.newsDetailPage}>
        <div className={styles.loading}>Xəbər yüklənir...</div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={styles.newsDetailPage}>
        <div className={styles.error}>
          <h2>Xəta</h2>
          <p>{error || 'Xəbər tapılmadı'}</p>
          <button 
            className={styles.backBtn}
            onClick={() => navigate('/news')}
          >
            Xəbərlərə qayıt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.newsDetailPage}>
      <div className={styles.hero}>
        <div className={styles.heroImage}>
          {news.image ? (
            <img 
              src={formatImageUrl(news.image)} 
              alt={news.title}
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
                onClick={() => navigate('/news')}
              >
                Xəbərlər
              </span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>Xəbər</span>
            </div>
            <h1>{news.title}</h1>
            <div className={styles.heroMeta}>
              {news.language && (
                <span className={styles.language}>{news.language}</span>
              )}
              {news.category?.name && (
                <span className={styles.category}>{news.category.name}</span>
              )}
              <span className={styles.date}>
                {formatDate(news.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.newsContent}>
            <div className={styles.contentBody}>
              <p>{news.content}</p>
            </div>
          </div>

          <div className={styles.sidebar}>
            <AdSpace position="detail-sidebar" />
            <div className={styles.newsInfo}>
              <h3>Xəbər Məlumatları</h3>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Başlıq:</span>
                <span className={styles.infoValue}>{news.title}</span>
              </div>
              {news.language && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Dil:</span>
                  <span className={styles.infoValue}>{news.language}</span>
                </div>
              )}
              {news.category?.name && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Kateqoriya:</span>
                  <span className={styles.infoValue}>{news.category.name}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tarix:</span>
                <span className={styles.infoValue}>{formatDate(news.created_at)}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.backButton}
                onClick={() => navigate('/news')}
              >
                Xəbərlərə qayıt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;