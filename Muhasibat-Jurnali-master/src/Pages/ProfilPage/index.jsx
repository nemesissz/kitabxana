import { useContext, useEffect, useState, useRef } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate, useLocation } from "react-router-dom";
import { getActiveSubscription } from "../../Services/paymentService";
import { getMyAccessiblePdfs } from "../../Services/pdfService";
import CircularProgress from "@mui/material/CircularProgress";

function ProfilPage() {
  const store = useContext(dataContext);
  const user = store?.user.data;
  console.log(user)
  const navigate = useNavigate();
  const location = useLocation();
  const pdfSectionRef = useRef(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  
  // Abonelik ve PDF bilgileri
  const [subscription, setSubscription] = useState(null);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [accessiblePdfs, setAccessiblePdfs] = useState([]);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingPdfs, setLoadingPdfs] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
      navigate("/login");
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const userData = response.data.data.user;
          store.user.setData(userData);
          
          // Purchased PDFs-i state-ə əlavə et
          console.log('👤 User loaded:', userData.email);
          console.log('📄 Purchased PDFs:', userData.purchasedPdfs);
          console.log('📅 Subscriptions:', userData.subscriptions);
          
          if (userData.purchasedPdfs) {
            setAccessiblePdfs(userData.purchasedPdfs);
            setLoadingPdfs(false);
          }
          
          if (userData.subscriptions && userData.subscriptions.length > 0) {
            const activeSub = userData.subscriptions.find(s => s.status === 'active' && s.plan !== 'none');
            setSubscription(activeSub || null);
            
            // Tüm abonelikleri kaydet (geçmiş dahil)
            setAllSubscriptions(userData.subscriptions.filter(s => s.plan !== 'none'));
            setLoadingSubscription(false);
          } else {
            setAllSubscriptions([]);
            setLoadingSubscription(false);
          }
        })
        .catch(() => {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        });
    }
  }, []);

  // PDF bölümünə scroll et (payment success səhifəsindən gəldikdə)
  useEffect(() => {
    if (location.state?.scrollToPdfs && pdfSectionRef.current) {
      // Bir az gecikmə ilə scroll et ki, səhifə tam yüklənsin
      setTimeout(() => {
        pdfSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 500);
    }
  }, [location.state, loadingPdfs, loadingSubscription]);



  const handleLogout = () => {
    store.user.setData(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    if (form.newPassword !== form.confirmPassword) {
      setMessage("Yeni şifrələr uyğun deyil!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const userID = localStorage.getItem("user");
      const response = await axios.patch(
        `${Base_Url_Server}users/${userID}`,
        {
          password: form.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Şifrə uğurla dəyişdirildi ✅");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Xəta baş verdi, yenidən cəhd edin!"
      );
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

  const getPlanName = (plan) => {
    const plans = {
      '1m': '1 Aylıq',
      '3m': '3 Aylıq',
      '6m': '6 Aylıq'
    };
    return plans[plan] || plan;
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <img
          src={`https://ui-avatars.com/api/?name=${user?.email || "Profil"}`}
          alt="Profil"
          className={styles.avatar}
        />
        <p className={styles.email}>{user?.email || "email@example.com"}</p>
        <div className={styles.details}>
          <p>
            <strong>Təhsil Email:</strong> {user?.eduEmail ? "Bəli" : "Xeyr"}
          </p>
        </div>

        <button
          className={styles.changePasswordButton}
          onClick={() => setShowPasswordForm(!showPasswordForm)}
        >
          {showPasswordForm ? "Bağla" : "Şifrəni dəyiş"}
        </button>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className={styles.passwordForm}>
            <input
              type="password"
              placeholder="Köhnə şifrə"
              value={form.oldPassword}
              onChange={(e) =>
                setForm({ ...form, oldPassword: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Yeni şifrə"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Yeni şifrəni təsdiqlə"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
            />
            <button type="submit" className={styles.savePasswordButton}>
              Yadda saxla
            </button>
            {message && <p className={styles.message}>{message}</p>}
          </form>
        )}

        <button className={styles.logoutButton} onClick={handleLogout}>
          Hesabdan çıxış
        </button>
      </div>

      {/* Abonelik Bilgileri */}
      <div className={styles.subscriptionCard}>
        <h2>Abunəlik Məlumatları</h2>
        {loadingSubscription ? (
          <div className={styles.loadingSection}>
            <CircularProgress size={30} />
            <p>Yüklənir...</p>
          </div>
        ) : subscription ? (
          <>
            <div className={styles.subscriptionDetails}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Plan:</span>
                <span className={styles.value}>{getPlanName(subscription.plan)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Başlama tarixi:</span>
                <span className={styles.value}>
                  {formatDate(subscription.startDate ?? subscription.start_date)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Bitmə tarixi:</span>
                <span className={styles.value}>
                  {formatDate(subscription.endDate ?? subscription.end_date)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Status:</span>
                <span className={`${styles.value} ${subscription.status === 'active' ? styles.active : styles.inactive}`}>
                  {subscription.status === 'active' ? 'Aktiv' : 'Aktiv deyil'}
                </span>
              </div>
            </div>

            {/* Tüm Abonelikler Listesi */}
            {allSubscriptions.length > 1 && (
              <div className={styles.allSubscriptions}>
                <h3>Bütün Abunəliklərim</h3>
                <div className={styles.subscriptionTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Başlanğıc</th>
                        <th>Bitiş</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSubscriptions.map((sub) => (
                        <tr key={sub.id}>
                          <td>{getPlanName(sub.plan)}</td>
                          <td>{formatDate(sub.startDate ?? sub.start_date)}</td>
                          <td>{formatDate(sub.endDate ?? sub.end_date)}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${
                              sub.status === 'active' ? styles.active : styles.inactive
                            }`}>
                              {sub.status === 'active' ? 'Aktiv' : 'Ləğv edilib'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noSubscription}>
            <p>Aktiv abunəliyiniz yoxdur</p>
            <button 
              className={styles.subscribeButton}
              onClick={() => navigate('/subscriptions')}
            >
              Abunə ol
            </button>
          </div>
        )}
      </div>

      {/* Alınmış PDF'lər - Yalnız subscription yoxdursa göstər */}
      {!subscription && (
        <div className={styles.pdfListCard} ref={pdfSectionRef}>
          <h2>Alınmış PDF-lər</h2>
          {loadingPdfs ? (
            <div className={styles.loadingSection}>
              <CircularProgress size={30} />
              <p>Yüklənir...</p>
            </div>
          ) : accessiblePdfs.length > 0 ? (
            <div className={styles.pdfList}>
              {accessiblePdfs.map((pdf) => (
                <div 
                  key={pdf.id} 
                  className={styles.pdfItem}
                 
                >
                  <div className={styles.pdfInfo}>
                    <h3>{pdf.title}</h3>
                    <div className={styles.pdfMeta}>
                      <span className={styles.date}>
                        {pdf.purchasedAt ? formatDate(pdf.purchasedAt) : ''}
                      </span>
                      <span className={styles.price}>{pdf.paidAmount} AZN</span>
                    </div>
                  </div>
                  {/* <button className={styles.viewButton}>Bax</button> */}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noPdfs}>
              <p>Hələ heç bir PDF almamısınız</p>
              <button 
                className={styles.browseButton}
                onClick={() => navigate('/')}
              >
                Kitabxanaya keç
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfilPage;
