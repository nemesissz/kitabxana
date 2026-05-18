import styles from "./index.module.scss";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PhoneIcon from "@mui/icons-material/Phone";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import { useNavigate } from "react-router-dom";
import AdSpace from "../../Components/AdSpace";

function Footer() {
  const navigate = useNavigate();

  return (
    <>
      <AdSpace position="footer-top" />
      <div className={styles.footerStart}>
        <div className={styles.container}>

          {/* Brend + Sosial */}
          <div className={styles.info}>
            <div className={styles.title}>
              <LocalLibraryIcon className={styles.logoIcon} />
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>MMU Kitabxana</span>
                <span className={styles.logoSub}>Ağıllı Kitabxana Sistemi</span>
              </div>
            </div>
            <p className={styles.paragraph}>
              PDF kitablar, xəbərlər və elanlarla həmişə məlumatlı qalın.
              Mühasibat, vergi və maliyyə sahəsində keyfiyyətli resurslar
              bir yerdə — pulsuz əlçatan.
            </p>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/muhasibatjurnal" target="_blank" rel="noreferrer" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="https://www.facebook.com/muhasibatjurnal" target="_blank" rel="noreferrer" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="https://www.tiktok.com/@muhasibatjurnal" target="_blank" rel="noreferrer" aria-label="TikTok">
                <MusicNoteIcon />
              </a>
              <a href="https://www.linkedin.com/company/muhasibatjurnal" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <LinkedInIcon />
              </a>
            </div>
          </div>

          {/* Naviqasiya */}
          <div className={styles.navigation}>
            <div className={styles.title}>
              <h3>Naviqasiya</h3>
            </div>
            <ul>
              <li onClick={() => navigate("/")}>
                <ArrowForwardIosIcon className={styles.icon} />
                Ana səhifə
              </li>
              <li onClick={() => navigate("/library")}>
                <ArrowForwardIosIcon className={styles.icon} />
                Kitabxana
              </li>
              <li onClick={() => navigate("/news")}>
                <ArrowForwardIosIcon className={styles.icon} />
                Xəbərlər
              </li>
              <li onClick={() => navigate("/announcements")}>
                <ArrowForwardIosIcon className={styles.icon} />
                Elanlar
              </li>
              <li onClick={() => navigate("/about")}>
                <ArrowForwardIosIcon className={styles.icon} />
                Haqqımızda
              </li>
            </ul>
          </div>

          {/* Əlaqə */}
          <div className={styles.contact}>
            <div className={styles.title}>
              <h3>Əlaqə</h3>
            </div>
            <div className={styles.contactItem}>
              <PhoneIcon className={styles.contactIcon} />
              <span>+994 55 210 85 97</span>
            </div>
            <p className={styles.paragraph}>
              Hər bir saytın məzmunu – məqalələr, dizayn elementləri, şəkillər
              və proqram təminatı – müəlliflik hüququ ilə qorunur.
            </p>
          </div>

        </div>
      </div>
      <a
        href="https://www.instagram.com/reverdigitallab.az?igsh=MTFvamdoOXN1dWxvZg=="
        target="_blank"
        rel="noreferrer"
        className={styles.footerEnd}
      >
        Developed by Rever Digital Lab
      </a>
      <AdSpace position="footer-bottom" />
    </>
  );
}

export default Footer;
