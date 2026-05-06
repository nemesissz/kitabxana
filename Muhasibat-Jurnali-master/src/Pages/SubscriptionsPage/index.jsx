import Footer from "../../Layouts/Footer";
import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import dataContext from "../../Contexts/GlobalState";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";
import { initiateCheckout } from "../../Services/paymentService";

function SubscriptionsPage() {
  const store = useContext(dataContext);
  const [subscriptions, setSubscriptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // Which plan is being checked out
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          store.user.setData(response.data.data.user);
        })
        .catch((error) => {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        });
    }
  }, []);

  useEffect(() => {
    // Fetch plan prices - these are the subscription plans created by admin
    console.log("Fetching subscription prices from:", Base_Url_Server + "subscriptions/prices");
    const token = localStorage.getItem("token");
    
    axios
      .get(Base_Url_Server + "subscriptions/prices", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      .then((res) => {
        console.log("Subscription prices API response:", res.data);
        const prices = res.data.data.prices;
        console.log("Parsed prices:", prices);
        
        // Convert the prices object to an array format
        const plansArray = Object.entries(prices).map(([planId, data]) => ({
          planId,
          name: data.plan_name || data.name || planId,
          price: data.price,
          priceInfo: data.priceInfo || null, // İndirimli fiyat bilgisi
          duration: data.duration || `${data.durationMonths} ay`,
          description: data.description || `${data.durationMonths} aylıq abunəlik`,
          durationMonths: data.durationMonths
        }));
        
        console.log("Processed plans array:", plansArray);
        setSubscriptions(plansArray);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Subscription prices fetch error:", error);
        setLoading(false);
      });
  }, []);

  const handleSubscribe = async (planId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setCheckoutLoading(planId); // Show loader for this plan
      
      const data = {
        type: 'subscription',
        plan: planId
      };
      
      const response = await initiateCheckout(data, token);
      
      if (response?.data?.payment?.paymentUrl) {
        window.location.href = response.data.payment.paymentUrl;
      } else {
        throw new Error('Ödəniş URL-i alınmadı');
      }
    } catch (error) {
      console.error('Ödəniş xətası:', error);
      setCheckoutLoading(null); // Hide loader on error
      alert('Ödəniş zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarix yoxdur';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tarix yoxdur';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}.${month}.${year}`;
    } catch (error) {
      return 'Tarix yoxdur';
    }
  };

  return (
    <>
      <section className={styles.subscriptions}>
        <div className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bg} alt="subscriptions" />
            <h1>Abunəlikləri Kəşf Et</h1>
          </div>
        </div>
        <div className={styles.subscriptionList}>
          <div className={styles.header}>
            <div></div>
            <CardGiftcardIcon className={styles.icon} />
            <div></div>
          </div>

          {loading ? (
            <div className={styles.loader}>
              <CircularProgress />
            </div>
          ) : subscriptions && subscriptions.length > 0 ? (
            <div className={styles.container}>
              {subscriptions.map((plan) => (
                <div key={plan.planId} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div className={styles.planHeader}>
                      <h2>{plan.name}</h2>
                      <div className={styles.priceContainer}>
                        {plan.priceInfo?.hasDiscount ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '0.9em', color: '#6b7280' }}>
                              {plan.priceInfo.originalPrice} AZN
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={styles.price} style={{ color: '#e74c3c' }}>
                                {plan.priceInfo.discountedPrice.toFixed(2)}
                              </span>
                              <span className={styles.currency}>AZN</span>
                            </div>
                            <span style={{ fontSize: '0.75em', color: '#27ae60', fontWeight: '600' }}>
                              {plan.priceInfo.discountPercent}% endirim
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className={styles.price}>{plan.price}</span>
                            <span className={styles.currency}>AZN</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={styles.description}>
                      {plan.description}
                    </div>

                    <div className={styles.features}>
                      <div className={styles.feature}>
                        <CheckCircleIcon className={styles.checkIcon} />
                        <span>Bütün PDF-lərə çıxış</span>
                      </div>
                      <div className={styles.feature}>
                        <CheckCircleIcon className={styles.checkIcon} />
                        <span>Prioritet dəstək</span>
                      </div>
                      <div className={styles.feature}>
                        <CheckCircleIcon className={styles.checkIcon} />
                        <span>Yeni kontentlər</span>
                      </div>
                    </div>

                    <button
                      className={styles.subscribeBtn}
                      onClick={() => handleSubscribe(plan.planId)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === plan.planId ? (
                        <>
                          <CircularProgress size={20} style={{ color: 'white', marginRight: '8px' }} />
                          Ödənişə yönləndirilirsiniz...
                        </>
                      ) : (
                        'Abunə ol'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>Abunəlik planı tapılmadı.</div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

export default SubscriptionsPage;

