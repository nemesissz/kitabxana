import styles from "./index.module.scss";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Swal from "sweetalert2";
import { displayCategoryName } from "../../Constants/categoryDisplay";

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
  </svg>
);

const ChevDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const MenuHamburger = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18M3 12h18M3 18h18"/>
  </svg>
);

function Header() {
  const navigator = useNavigate();
  const location = useLocation();
  const store = useContext(dataContext);
  const [categories, setCategories] = useState([]);
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [variant, setVariant] = useState(() => localStorage.getItem("mmu-variant") || "editorial");
  const libTimer = useRef(null);
  const userTimer = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-variant", variant);
    localStorage.setItem("mmu-variant", variant);
  }, [variant]);

  useEffect(() => {
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
  }, []);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const user = store.user.data;

  const initials = user
    ? (user.fullName || user.login || "?")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || "")
        .join("")
    : "?";

  const firstName = user
    ? user.fullName?.split(" ")[0] || user.login
    : null;

  const openLib = () => { clearTimeout(libTimer.current); setShowLibraryDropdown(true); };
  const closeLib = () => { libTimer.current = setTimeout(() => setShowLibraryDropdown(false), 120); };
  const openUser = () => { clearTimeout(userTimer.current); setShowUserDropdown(true); };
  const closeUser = () => { userTimer.current = setTimeout(() => setShowUserDropdown(false), 120); };

  return (
    <header className={styles.siteHeader}>
      <nav className={`${styles.nav} mmu-container`}>

        {/* ── Brand ── */}
        <div className={styles.brand} onClick={() => navigator("/")}>
          <div className={styles.brandMark}>
            <BookIcon />
          </div>
          <div className={styles.brandName}>
            <b>MMU Kitabxana</b>
            <small>Ağıllı Kitabxana Sistemi</small>
          </div>
        </div>

        {/* ── Nav links ── */}
        <div className={styles.navLinks}>
          <button
            className={`${styles.navLink} ${isActive("/") ? styles.navLinkActive : ""}`}
            onClick={() => navigator("/")}
          >
            Ana səhifə
          </button>

          {/* Kitabxana + dropdown */}
          <div
            className={styles.navLinkWrap}
            onMouseEnter={openLib}
            onMouseLeave={closeLib}
          >
            <button
              className={`${styles.navLink} ${isActive("/library") ? styles.navLinkActive : ""}`}
              onClick={() => navigator("/library")}
            >
              Kitabxana
              <ChevDown />
            </button>

            {showLibraryDropdown && (
              <div className={styles.dropdown}>
                {user && (
                  <button
                    className={styles.dropItem}
                    onClick={() => {
                      if (!user.uploadPermission || user.uploadPermission === "none") {
                        Swal.fire({ icon: "warning", title: "İcazə yoxdur", text: "Bu funksiya üçün rolunuz uyğun deyil.", confirmButtonColor: "#0B1F3D" });
                        setShowLibraryDropdown(false);
                        return;
                      }
                      navigator("/library/submit");
                      setShowLibraryDropdown(false);
                    }}
                  >
                    📤 PDF Yüklə
                  </button>
                )}
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={styles.dropItem}
                    onClick={() => { navigator(`/library?category=${cat.id}`); setShowLibraryDropdown(false); }}
                  >
                    {displayCategoryName(cat.name)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className={`${styles.navLink} ${isActive("/announcements") ? styles.navLinkActive : ""}`}
            onClick={() => navigator("/announcements")}
          >
            Elanlar
          </button>

          {user?.role >= 2 && (
            <button
              className={styles.navLink}
              style={{ color: "var(--muted)" }}
              onClick={() => navigator("/admin")}
            >
              Admin
            </button>
          )}
        </div>

        {/* ── Variant toggle ── */}
        <div className={styles.themeToggle}>
          <button
            className={`${styles.themeBtn} ${variant === "editorial" ? styles.themeBtnActive : ""}`}
            onClick={() => setVariant("editorial")}
          >
            Editorial
          </button>
          <button
            className={`${styles.themeBtn} ${variant === "modern" ? styles.themeBtnActive : ""}`}
            onClick={() => setVariant("modern")}
          >
            Modern
          </button>
        </div>

        {/* ── Right: user chip or login ── */}
        <div className={styles.navRight}>
          {user ? (
            <div
              className={styles.userChip}
              onMouseEnter={openUser}
              onMouseLeave={closeUser}
            >
              <div className={styles.avatar}>{initials}</div>
              <span className={styles.userName}>{firstName}</span>
              <ChevDown />

              {showUserDropdown && (
                <div className={`${styles.dropdown} ${styles.userDropdown}`}>
                  <button className={styles.dropItem} onClick={() => navigator("/profile")}>
                    👤 Profilim
                  </button>
                  <button
                    className={`${styles.dropItem} ${styles.dropItemDanger}`}
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
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="mmu-btn mmu-btn-ghost mmu-btn-sm"
                onClick={() => navigator("/login")}
              >
                Daxil ol
              </button>
              <button
                className="mmu-btn mmu-btn-primary mmu-btn-sm"
                onClick={() => navigator("/register")}
              >
                Qeydiyyat
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => store.sidebar.setData(!store.sidebar.data)}
          aria-label="Menyu"
        >
          <MenuHamburger />
        </button>

      </nav>
    </header>
  );
}

export default Header;
