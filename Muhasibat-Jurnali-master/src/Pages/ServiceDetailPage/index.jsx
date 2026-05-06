import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import styles from "./index.module.scss";
import heroImage from "../../Assets/heroImage.jpg";

const ServiceDetailPage = () => {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "Tarix yoxdur";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Tarix yoxdur";

      // gün.ay.il formatında (dd.mm.yyyy)
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}.${month}.${year}`;
    } catch (error) {
      console.error("Date formatlaşdırması xətası:", error);
      return "Tarix yoxdur";
    }
  };

  const formatPrice = (price) => {
    if (!price) return "Qiymət müəyyən edilməyib";
    return `${price}`;
  };

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        console.log("Fetching Service with ID:", id);
        const response = await axios.get(Base_Url_Server + `services/${id}`);
        console.log("Service API response:", response.data);

        // API response structure: {status: "success", data: {service: {...}}}
        const serviceData = response.data?.data?.service;
        console.log("Parsed Service data:", serviceData);

        if (serviceData) {
          setService(serviceData);
        } else {
          setError("Xidmət məlumatları tapılmadı");
        }
      } catch (error) {
        console.error("Xidmət yüklenirkən xəta:", error);
        if (error.response) {
          setError(
            `API xətası: ${error.response.status} - ${
              error.response.data?.message || error.message
            }`
          );
        } else {
          setError("Şəbəkə xətası: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
    } else {
      setError("Xidmət ID-si tapılmadı");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className={styles.serviceDetailPage}>
        <div className={styles.loading}>Xidmət yüklənir...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className={styles.serviceDetailPage}>
        <div className={styles.error}>
          <h2>Xəta</h2>
          <p>{error || "Xidmət tapılmadı"}</p>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/xidmetler")}
          >
            Xidmətlərə qayıt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.serviceDetailPage}>
      <div className={styles.hero}>
        <div className={styles.heroImage}>
          <img
            src={
              service.image_path
                ? `${Base_Url_Server.replace("/api/", "")}${service.image_path}`
                : heroImage
            }
            alt={service.name}
            onError={(e) => {
              e.target.src = heroImage; // Fallback image
            }}
          />
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <h1>{service.name}</h1>
            <div className={styles.heroMeta}>
              <span className={styles.price}>
                {formatPrice(service.price)} AZN
              </span>
              <span className={styles.date}>
                {formatDate(service.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.serviceContent}>
            <div className={styles.description}>
              <h3>Xidmət haqqında</h3>
              <div className={styles.contentBody}>
                <p>{service.description}</p>
              </div>
            </div>

            <div className={styles.serviceActions}>
              <a
                href="mailto:m.aliyev@mail.ru"
                className={styles.contactButton}
              >
                Əlaqə saxla
              </a>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.serviceInfo}>
              <h3>Xidmət Məlumatları</h3>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ad:</span>
                <span className={styles.infoValue}>{service.name}</span>
              </div>
              {service.price && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Qiymət:</span>
                  <span className={styles.infoValue}>
                    {service.price} {service.currency}
                  </span>
                </div>
              )}
              {service.is_active !== undefined && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status:</span>
                  <span className={styles.infoValue}>
                    {service.is_active ? "Aktiv" : "Deaktiv"}
                  </span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tarix:</span>
                <span className={styles.infoValue}>
                  {formatDate(service.created_at)}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.backButton}
                onClick={() => navigate("/services")}
              >
                Xidmətlərə qayıt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
