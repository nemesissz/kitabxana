import styles from "./index.module.scss";
import logo from "../../Assets/logo.png";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dataContext from "../../Contexts/GlobalState";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PersonIcon from "@mui/icons-material/Person";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import AdSpace from "../../Components/AdSpace";

function Header() {
  const navigator = useNavigate();
  const store = useContext(dataContext);
  const [categories, setCategories] = useState([]);
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);
  console.log(store.user.data);

  // Kategorileri yükle
  useEffect(() => {
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories || []))
      .catch((err) => console.log("Kateqoriyalar yüklənmədi:", err));
  }, []);

  // Hüquqi səhifələr üçün yol yoxlaması
  const isLegalPage = () => {
    const path = window.location.pathname;
    return (
      path === "/terms-of-use" ||
      path === "/privacy-policy" ||
      path === "/copyright"
    );
  };

  // Kitabxana sayfası kontrolü
  const isLibraryPage = () => {
    const path = window.location.pathname;
    return path === "/library" || path.startsWith("/library/");
  };

  return (
    <>
      <AdSpace position="header-top" />
      <div className={styles.header}>
        <div className={styles.container}>
        <div
          onClick={() => {
            navigator("/");
          }}
          className={styles.left}
        >
          <img src={logo} className={styles.logo} alt="accountant" />
          <h3 className={styles.title}>Mühasibat Jurnalı</h3>
        </div>
        <div className={styles.right}>
          <ul>
            {/* Ana səhifə */}
            <li
              onClick={() => navigator("/")}
              style={
                window.location.pathname === "/"
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              Ana səhifə
            </li>

            {/* Kitabxana Dropdown */}
            <li
              className={styles.dropdown}
              onMouseEnter={() => setShowLibraryDropdown(true)}
              onMouseLeave={() => setShowLibraryDropdown(false)}
              style={
                isLibraryPage()
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              <span className={styles.dropdownLabel}>
                Kitabxana
                <ArrowDropDownIcon className={styles.dropdownIcon} />
              </span>
              {showLibraryDropdown && (
                <div className={styles.dropdownMenu}>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <div
                        key={cat.id}
                        className={styles.dropdownItem}
                        onClick={() => {
                          navigator(`/library/category/${cat.id}`);
                          setShowLibraryDropdown(false);
                        }}
                      >
                        {cat.name}
                      </div>
                    ))
                  ) : (
                    <div className={styles.dropdownItem}>Yüklənir...</div>
                  )}
                </div>
              )}
            </li>
            {/* CV Nümunələri */}
            <li
              onClick={() => navigator("/cv-templates")}
              style={
                window.location.pathname === "/cv-templates"
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              CV Nümunələri
            </li>
            {/* Aboneliklər */}
            <li
              onClick={() => navigator("/subscriptions")}
              style={
                window.location.pathname === "/subscriptions"
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              Abunəliklər
            </li>

            {/* Servislər */}
            <li
              onClick={() => navigator("/services")}
              style={
                window.location.pathname.startsWith("/services")
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              Servislər
            </li>

            {/* Xəbərlər */}
            <li
              onClick={() => navigator("/news")}
              style={
                window.location.pathname === "/news"
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              Xəbərlər
            </li>

            {/* Kalkulyator */}
            <li
              onClick={() => navigator("/calculator")}
              style={
                window.location.pathname === "/calculator"
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              Kalkulyator
            </li>

            {/* Hüquqi Məlumatlar Dropdown */}
            <li
              className={styles.dropdown}
              style={
                isLegalPage()
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              <span className={styles.dropdownLabel}>
                Hüquqi Məlumatlar
                {/* <ArrowDropDownIcon className={styles.dropdownIcon} /> */}
              </span>
              <div className={styles.dropdownMenu}>
                <div
                  className={styles.dropdownItem}
                  onClick={() => navigator("/terms-of-use")}
                >
                  İstifadə Şərtləri
                </div>
                <div
                  className={styles.dropdownItem}
                  onClick={() => navigator("/privacy-policy")}
                >
                  Məxfilik Siyasəti
                </div>
                <div
                  className={styles.dropdownItem}
                  onClick={() => navigator("/copyright")}
                >
                  Müəllif Hüquqları
                </div>
              </div>
            </li>
            <li
              className={styles.person}
              onClick={() => {
                if (store.user.data) {
                  navigator("/profile");
                } else {
                  navigator("/login");
                }
              }}
              style={
                window.location.pathname == "/calculator"
                  ? { color: "#032062", backgroundColor: "white" }
                  : {}
              }
            >
              <PersonIcon />
            </li>
          </ul>
        </div>
        <MenuIcon
          onClick={() => {
            store.sidebar.setData(!store.sidebar.data);
          }}
          className={styles.icons}
        />
      </div>
      </div>
      <AdSpace position="header-bottom" />
    </>
  );
}

export default Header;
