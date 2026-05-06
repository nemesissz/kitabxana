import Footer from "../../Layouts/Footer";
import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import CircularProgress from "@mui/material/CircularProgress";
import dataContext from "../../Contexts/GlobalState";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";

function ServicesPage() {
  const store = useContext(dataContext);
  const [services, setServices] = useState(null);
  const [filtered, setFiltered] = useState(null);
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
    axios.get(Base_Url_Server + "services").then((res) => {
      setServices(res.data.data.services);
      setFiltered(res.data.data.services);
    });
  }, []);
  return (
    <>
      <section></section>
      <section className={styles.services}>
        <div className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bg} alt="accountant" />
            <h1>Hüquq və mühasibat işlərinizdə etibarlı tərəfdaşınız.</h1>
          </div>
        </div>
        <div className={styles.serviceList}>
          <div className={styles.header}>
            <div></div>
            <MiscellaneousServicesIcon className={styles.icon} />
            <div></div>
          </div>

          <div className={styles.filter}>
            <input
              type="text"
              placeholder="Axtar"
              aria-label="Axtar xidmətlər"
              onChange={(e) => {
                const q = e.target.value.trim().toLowerCase();
                if (!services) return;
                if (q === "") {
                  setFiltered(services);
                  return;
                }
                const filteredList = services.filter((service) => {
                  const name = (service.name || "").toLowerCase();
                  const desc = (service.description || "").toLowerCase();
                  return name.includes(q) || desc.includes(q);
                });
                setFiltered(filteredList);
              }}
            />
          </div>

          <div className={styles.container}>
            {services === null ? (
              <div className={styles.loader}>
                <CircularProgress />
              </div>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((e) => (
                <div
                  key={e.id}
                  className={styles.card}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/services/${e.id}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") navigate(`/services/${e.id}`);
                  }}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.icons}>
                      <div className={styles.hr}></div>
                      <BookmarksIcon />
                      <div className={styles.hr}></div>
                    </div>
                    <div className={styles.title}>{e.name}</div>
                    <div className={styles.description}>
                      {(e.description || "").length > 100
                        ? `${(e.description || "").slice(0, 100)}…`
                        : e.description}
                    </div>
                    <div className={styles.price}>
                      {e.price != null ? `${e.price} ₼` : "Qiymət göstərilməyib"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>Heç bir xidmət tapılmadı.</div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default ServicesPage;
