import styles from "./index.module.scss";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import dataContext from "../../Contexts/GlobalState";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CampaignIcon from "@mui/icons-material/Campaign";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import AdSpace from "../../Components/AdSpace";
import Swal from "sweetalert2";

function Header() {
  const navigator = useNavigate();
  const location = useLocation();
  const store = useContext(dataContext);
  const [categories, setCategories] = useState([]);
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
  }, []);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const userLabel = store.user.data
    ? store.user.data.fullName?.split(" ")[0] || store.user.data.login
    : "Daxil ol";

  return (
    <>
      <AdSpace position="header-top" />
      <header className={styles.header}>
        <div className={styles.container}>

          {/* ── Logo ── */}
          <div className={styles.logo} onClick={() => navigator("/")}>
            <LocalLibraryIcon className={styles.logoIcon} />
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>MMU Kitabxana</span>
              <span className={styles.logoSub}>Ağıllı Kitabxana Sistemi</span>
            </div>
          </div>

          {/* ── Nav ── */}
          <nav className={styles.nav}>
            {/* Ana səhifə */}
            <div
              className={`${styles.navItem} ${isActive("/") ? styles.active : ""}`}
              onClick={() => navigator("/")}
            >
              <HomeIcon className={styles.navIcon} />
              <span>Ana səhifə</span>
            </div>

            {/* Kitabxana dropdown */}
            <div
              className={`${styles.navItem} ${styles.hasDropdown} ${isActive("/library") ? styles.active : ""}`}
              onMouseEnter={() => setShowLibraryDropdown(true)}
              onMouseLeave={() => setShowLibraryDropdown(false)}
            >
              <MenuBookIcon className={styles.navIcon} />
              <span>Kitabxana</span>
              <ArrowDropDownIcon className={`${styles.chevron} ${showLibraryDropdown ? styles.chevronOpen : ""}`} />

              {showLibraryDropdown && (
                <div className={styles.dropdown}>
                  {store.user.data && (
                    <div
                      className={styles.dropdownLink}
                      onClick={() => {
                        if (!store.user.data.uploadPermission || store.user.data.uploadPermission === "none") {
                          Swal.fire({ icon: "warning", title: "İcazə yoxdur", text: "Bu funksiya üçün rolunuz uyğun deyil.", confirmButtonColor: "#2c3e50" });
                          setShowLibraryDropdown(false);
                          return;
                        }
                        navigator("/library/submit");
                        setShowLibraryDropdown(false);
                      }}
                    >
                      PDF Yüklə
                    </div>
                  )}
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={styles.dropdownLink}
                      onClick={() => { navigator(`/library/category/${cat.id}`); setShowLibraryDropdown(false); }}
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Elan */}
            <div
              className={`${styles.navItem} ${isActive("/news") ? styles.active : ""}`}
              onClick={() => navigator("/news")}
            >
              <CampaignIcon className={styles.navIcon} />
              <span>Elan</span>
            </div>

            {/* Admin panel — yalnız role>=2 üçün */}
            {store.user.data?.role >= 2 && (
              <div
                className={styles.navItem}
                style={{ color: "#6a1b9a" }}
                onClick={() => navigator("/admin")}
              >
                <AdminPanelSettingsIcon className={styles.navIcon} />
                <span>Admin panel</span>
              </div>
            )}
          </nav>

          {/* ── Sağ: user ── */}
          <div
            className={styles.userArea}
            onMouseEnter={() => setShowUserDropdown(true)}
            onMouseLeave={() => setShowUserDropdown(false)}
          >
            <div className={styles.userAvatar}>
              <PersonIcon className={styles.avatarIcon} />
            </div>
            <span className={styles.userName}>{userLabel}</span>
            <ArrowDropDownIcon className={`${styles.chevron} ${showUserDropdown ? styles.chevronOpen : ""}`} />

            {showUserDropdown && (
              <div className={`${styles.dropdown} ${styles.userDropdown}`}>
                {store.user.data ? (
                  <>
                    <div className={styles.dropdownLink} onClick={() => navigator("/profile")}>
                      Profilim
                    </div>
                    <div
                      className={styles.dropdownLink}
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        localStorage.removeItem("_sid");
                        store.user.setData(null);
                        navigator("/");
                        setShowUserDropdown(false);
                      }}
                    >
                      Çıxış
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.dropdownLink} onClick={() => navigator("/login")}>Daxil ol</div>
                    <div className={styles.dropdownLink} onClick={() => navigator("/register")}>Qeydiyyat</div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobil */}
          <MenuIcon
            className={styles.menuIcon}
            onClick={() => store.sidebar.setData(!store.sidebar.data)}
          />
        </div>
      </header>
      <AdSpace position="header-bottom" />
    </>
  );
}

export default Header;
