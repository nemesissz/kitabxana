import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import CampaignIcon from "@mui/icons-material/Campaign";
import Footer from "../../Layouts/Footer";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import CircularProgress from "@mui/material/CircularProgress";

function NewsPage() {
  const [announcements, setAnnouncements] = useState(null);
  const store = useContext(dataContext);
  const [loader, setLoader] = useState(false);
  const [filter, setFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    document.title = "Elanlar";
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => store.user.setData(res.data.data.user))
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
    setLoader(true);
    axios
      .get(Base_Url_Server + "announcements")
      .then((res) => {
        setAnnouncements(res.data.data.announcements || []);
        setLoader(false);
      })
      .catch(() => {
        setAnnouncements([]);
        setLoader(false);
      });
  }, []);

  const filtered = announcements
    ? announcements.filter((ann) => {
        const matchSearch =
          !search || ann.title.toLowerCase().includes(search.toLowerCase());
        const matchPriority = !priority || ann.priority === priority;
        return matchSearch && matchPriority;
      })
    : [];

  return (
    <>
      <section className={styles.news}>
        <div className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bg} alt="elanlar" />
            <h1>Universitetin ən son elanları və duyuruları.</h1>
          </div>
        </div>

        <div className={styles.newsList}>
          <div className={styles.header}>
            <div></div>
            <CampaignIcon className={styles.icon} />
            <div></div>
          </div>

          <div className={styles.filter}>
            <div
              className={styles.content}
              style={filter ? {} : { height: "60px" }}
            >
              <TuneIcon
                className={styles.iconFilter}
                onClick={() => setFilter(!filter)}
              />
              <div className={styles.head}>
                <div>
                  <input
                    onChange={(e) => setSearch(e.target.value)}
                    type="text"
                    placeholder="Axtar"
                    value={search}
                  />
                  <button type="button">
                    <SearchIcon className={styles.icon} />
                  </button>
                </div>
              </div>
              <form className={styles.dropDown}>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="">Bütün prioritetlər</option>
                  <option value="normal">Normal</option>
                  <option value="urgent">Təcili</option>
                </select>
                <button
                  type="reset"
                  onClick={() => { setSearch(""); setPriority(""); }}
                >
                  Filterləri təmizlə
                </button>
              </form>
            </div>
          </div>

          <div
            style={loader ? { display: "none" } : {}}
            className={styles.container}
          >
            {filtered.length === 0 && !loader ? (
              <div style={{ textAlign: "center", color: "#999", padding: "40px", width: "100%" }}>
                Elan tapılmadı
              </div>
            ) : (
              filtered.map((ann, i) => (
                <div key={i} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div className={styles.cardImage}>
                      {ann.image ? (
                        <img src={ann.image} alt={ann.title} />
                      ) : (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          color: "#666",
                          fontSize: "14px",
                          textAlign: "center",
                          padding: "20px",
                        }}>
                          Şəkil yoxdur
                        </div>
                      )}
                    </div>
                    <div className={styles.cardText}>
                      <span>{ann.title}</span>
                      {ann.description && (
                        <p style={{ fontSize: "13px", color: "#555", margin: "6px 0", lineHeight: "1.5" }}>
                          {ann.description.length > 120
                            ? ann.description.slice(0, 120) + "..."
                            : ann.description}
                        </p>
                      )}
                      <p>
                        <span>{ann.created_at?.split("T")[0]}</span>
                        <span style={{
                          background: ann.priority === "urgent" ? "#ffeaea" : "#eaf4ff",
                          color: ann.priority === "urgent" ? "#c0392b" : "#2471a3",
                          borderRadius: "12px",
                          padding: "2px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}>
                          {ann.priority === "urgent" ? "Təcili" : "Normal"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
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

export default NewsPage;
