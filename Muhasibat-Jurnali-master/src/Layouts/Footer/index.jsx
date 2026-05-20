import styles from "./index.module.scss";
import { useNavigate } from "react-router-dom";

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
  </svg>
);

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} mmu-container`}>
        <div className={styles.grid}>

          {/* Col 1 — brand */}
          <div className={styles.col}>
            <div className={styles.brand}>
              <div className={styles.brandMark}><BookIcon /></div>
              <div>
                <div className={styles.brandTitle}>MMU Kitabxana</div>
                <div className={styles.brandSub}>Ağıllı Kitabxana Sistemi</div>
              </div>
            </div>
            <p className={styles.desc}>
              PDF kitablar, elanlar və akademik resurslarla həmişə məlumatlı qalın.
              Universitet daxilində pulsuz əlçatan.
            </p>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/muhasibatjurnal" target="_blank" rel="noreferrer" aria-label="Instagram" className={styles.socialLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="https://www.facebook.com/muhasibatjurnal" target="_blank" rel="noreferrer" aria-label="Facebook" className={styles.socialLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/muhasibatjurnal" target="_blank" rel="noreferrer" aria-label="LinkedIn" className={styles.socialLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          {/* Col 2 — Kitabxana */}
          <div className={styles.col}>
            <h4>Kitabxana</h4>
            <ul className={styles.linkList}>
              <li><button onClick={() => navigate("/library")}>Bütün resurslar</button></li>
              <li><button onClick={() => navigate("/library")}>PDF fondumuz</button></li>
              <li><button onClick={() => navigate("/library/submit")}>PDF Yüklə</button></li>
            </ul>
          </div>

          {/* Col 3 — Səhifələr */}
          <div className={styles.col}>
            <h4>Səhifələr</h4>
            <ul className={styles.linkList}>
              <li><button onClick={() => navigate("/")}>Ana səhifə</button></li>
              <li><button onClick={() => navigate("/news")}>Elanlar</button></li>
              <li><button onClick={() => navigate("/profile")}>Profilim</button></li>
              <li><button onClick={() => navigate("/login")}>Daxil ol</button></li>
            </ul>
          </div>

          {/* Col 4 — Əlaqə */}
          <div className={styles.col}>
            <h4>Əlaqə</h4>
            <ul className={styles.linkList}>
              <li>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12 19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 2.88 1h3A2 2 0 0 1 7.76 2.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L6.73 8.91a16 16 0 0 0 6.29 6.29l1.26-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.06 16a2 2 0 0 1 .96.92Z"/></svg>
                  +994 55 210 85 97
                </span>
              </li>
              <li>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  info@mmu.edu.az
                </span>
              </li>
            </ul>
          </div>

        </div>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} MMU Kitabxana. Bütün hüquqlar qorunur.</span>
          <a href="https://www.instagram.com/reverdigitallab.az" target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,.35)", fontSize: 12 }}>
            Developed by Rever Digital Lab
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
