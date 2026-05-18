import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";
import bg from "./../../Assets/heroImage.jpg";
import BookIcon from "@mui/icons-material/Book";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";

function LibraryPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);

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
          if (error.response?.status === 401) {
            store.user.setData(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        });
    }
  }, []);
  useEffect(() => {
    document.title = "Kitabxana";
  }, []);

  // Kategorileri yükle
  useEffect(() => {
    setLoader(true);
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => {
        setCategories(res.data.data.categories);
        setLoader(false);
      })
      .catch((err) => {
        console.log("Kateqoriyalar yüklənmədi:", err);
        setLoader(false);
      });
  }, []);

  return (
    <>
      <section className={styles.library}>
        <div className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bg} alt="accountant" />
            <h1>Vergi və mühasibatlıq–sənədin hazır, işin asan!</h1>
          </div>
        </div>
        <div className={styles.bookList}>
          <div className={styles.header}>
            <div></div>
            <BookIcon className={styles.icon} />
            <div></div>
          </div>

          {/* Düymələr */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/library/all')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', background: '#fff', color: '#2c3e50',
                border: '2px solid #2c3e50', borderRadius: '8px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer'
              }}
            >
              Bütün PDF-lər
            </button>
            <button
              onClick={() => navigate('/library/submit')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', background: '#2c3e50', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer'
              }}
            >
              <UploadFileIcon style={{ fontSize: 20 }} />
              PDF Yüklə
            </button>
          </div>

          {/* Kategoriler Listesi */}
          <div className={styles.container} style={{ padding: '40px 20px', display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className={styles.card}
                  onClick={() => navigate(`/library/category/${cat.id}`)}
                  role="button"
                  tabIndex={0}
                  style={{
                    cursor: 'pointer',
                    maxWidth: '300px',
                    minWidth: '250px',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader} style={{ padding: '30px 20px', textAlign: 'center' }}>
                      <h2>
                        <span>{cat.name}</span>
                      </h2>
                      <h5 style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                        {cat.display_type === 'tax-journal' 
                          ? 'Vergi-jurnali tərzində (Aylara görə)' 
                          : 'Sair kitablar tərzində (Tarixə görə)'}
                      </h5>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', width: '100%' }}>
                <p>Hələ heç bir kateqoriya yoxdur</p>
              </div>
            )}
          </div>

          <div
            style={loader ? {} : { display: "none" }}
            className={styles.loader}
          >
            <CircularProgress />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default LibraryPage;
