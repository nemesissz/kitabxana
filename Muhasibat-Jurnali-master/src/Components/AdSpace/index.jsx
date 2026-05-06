import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Base_Url_Server, { formatServerFilePath } from '../../Constants/baseUrl';
import styles from './index.module.scss';

const AdSpace = ({ position, className = '' }) => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${Base_Url_Server}ads/spaces/${position}`);
        console.log(`[AdSpace] ${position} üçün API cavabı:`, response.data);
        const fetchedAds = response.data.data.ads || [];
        console.log(`[AdSpace] ${position} üçün tapılan reklamlar:`, fetchedAds);
        
        // Eğer birden fazla reklam varsa, en yüksek öncelikli olanı seç
        if (fetchedAds.length > 0) {
          // Önceliğe göre sırala ve ilkini al
          const sortedAds = fetchedAds.sort((a, b) => (b.priority || 0) - (a.priority || 0));
          console.log(`[AdSpace] ${position} üçün sıralanmış reklamlar:`, sortedAds);
          setAds(sortedAds);
        } else {
          console.log(`[AdSpace] ${position} üçün reklam tapılmadı`);
          setAds([]);
        }
      } catch (error) {
        console.error(`[AdSpace] ${position} üçün reklam yüklənərkən xəta:`, error);
        console.error('Xəta detalları:', error.response?.data || error.message);
        setAds([]);
      } finally {
        setLoading(false);
      }
    };

    if (position) {
      fetchAds();
    }
  }, [position]);

  // Görüntülenme sayacını artır (sadece bir kez)
  useEffect(() => {
    if (ads.length > 0 && !hasTrackedView.current) {
      const currentAd = ads[currentAdIndex];
      if (currentAd && currentAd.id) {
        axios.post(`${Base_Url_Server}ads/${currentAd.id}/view`).catch(err => {
          console.error('Görüntülenme sayacı xətası:', err);
        });
        hasTrackedView.current = true;
      }
    }
  }, [ads, currentAdIndex]);

  // Tıklama sayacını artır
  const handleClick = async (ad) => {
    if (ad.link_url) {
      try {
        await axios.post(`${Base_Url_Server}ads/${ad.id}/click`);
        window.open(ad.link_url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Tıklama sayacı xətası:', error);
        // Hata olsa bile linki aç
        window.open(ad.link_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (loading) {
    console.log(`[AdSpace] ${position} yüklənir...`);
    return null; // Yüklenirken hiçbir şey gösterme
  }

  if (ads.length === 0) {
    console.log(`[AdSpace] ${position} üçün reklam yoxdur`);
    return null; // Reklam yoksa hiçbir şey gösterme
  }

  const currentAd = ads[currentAdIndex];
  console.log(`[AdSpace] ${position} üçün göstərilən reklam:`, currentAd);

  const imageUrl = formatServerFilePath(currentAd.content) || currentAd.content;
  console.log(`[AdSpace] ${position} üçün şəkil URL:`, imageUrl);

  return (
    <div className={`${styles.adSpace} ${className}`}>
      {currentAd.type === 'banner' ? (
        <div 
          className={styles.bannerAd}
          onClick={() => handleClick(currentAd)}
          style={{ cursor: currentAd.link_url ? 'pointer' : 'default' }}
        >
          <img
            src={imageUrl}
            alt={currentAd.title}
            onError={(e) => {
              console.error(`[AdSpace] ${position} üçün şəkil yüklənə bilmədi:`, imageUrl);
              e.target.style.display = 'none';
            }}
            onLoad={() => {
              console.log(`[AdSpace] ${position} üçün şəkil uğurla yükləndi:`, imageUrl);
            }}
          />
        </div>
      ) : currentAd.type === 'video' ? (
        <div className={styles.videoAd}>
          <div
            dangerouslySetInnerHTML={{ __html: currentAd.content }}
            onClick={() => handleClick(currentAd)}
            style={{ cursor: currentAd.link_url ? 'pointer' : 'default' }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default AdSpace;

