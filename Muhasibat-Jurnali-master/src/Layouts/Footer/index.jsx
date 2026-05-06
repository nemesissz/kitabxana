import styles from "./index.module.scss";
import { useState, useEffect } from "react";
import logo from "./../../Assets/logo.png";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { useNavigate } from "react-router-dom";
import AdSpace from "../../Components/AdSpace";

function Footer() {
  const [path, setPath] = useState(false);
  const navigate = useNavigate();

  const handleScroll = () => {
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);
  return (
    <>
      <AdSpace position="footer-top" />
      <div className={styles.footerStart}>
        <div className={styles.container}>
          <div className={styles.info}>
            <div className={styles.title}>
              <img src={logo} alt="" />
              <h3>Mühasibat jurnalı</h3>
            </div>
            <p className={styles.paragraph}>
              Vergi və hesabat işləri artıq sizin üçün çətinlik yaratmayacaq.
              Peşəkar komandamız dəqiq, sürətli və etibarlı xidmətlə daim
              yanınızdadır.
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
          {/* <div className={styles.hr}></div> */}
          <div className={styles.navigation}>
            <div className={styles.title}>
              <h3>Naviqasiya</h3>
            </div>
            <ul>
              <li onClick={() => navigate('/')}>
                <ArrowForwardIosIcon className={styles.icon} />
                Ana səhifə
              </li>
              <li onClick={() => navigate('/')}>
                <ArrowForwardIosIcon className={styles.icon} />
                Kitabxana
              </li>
              <li onClick={() => navigate('/cv-templates')}>
                <ArrowForwardIosIcon className={styles.icon} />
                CV Nümunələri
              </li>
              <li onClick={() => navigate('/services')}>
                <ArrowForwardIosIcon className={styles.icon} />
                Servislər
              </li>
              <li onClick={() => navigate('/news')}>
                <ArrowForwardIosIcon className={styles.icon} />
                Xəbərlər
              </li>
              <li onClick={() => navigate('/calculator')}>
                <ArrowForwardIosIcon className={styles.icon} />
                Kalkulyator
              </li>
            </ul>
          </div>
          {/* <div className= {styles.hr}></div> */}

          <div className={styles.security}>
            <div className={styles.title}>
              <h3>© Müəllif hüquqları qorunur</h3>
            </div>
            <p className={styles.paragraph}>
              Hər bir saytın məzmunu – məqalələr, dizayn elementləri, şəkillər,
              videolar və proqram təminatı – müəlliflik hüququ ilə qorunur və bu
              materialların icazəsiz istifadəsi qanunsuz hesab olunur.
            </p>
             <p className={styles.paragraph}>
              "Əlaqə nömrəsi: +994 55 210 85 97"
            </p>
          </div>

          {/* <div className={styles.action}>
            <div className={styles.title}>
              <h3>Hərəkət</h3>
            </div>
            <ul>
              <li onClick={handleScroll}>
                <ArrowForwardIosIcon className={styles.icon} />
                Başlığa qayıt
              </li>
              <li onClick={handleScroll}>
                <ArrowForwardIosIcon className={styles.icon} />
                Başlığa qayıt
              </li>
              <li onClick={handleScroll}>
                <ArrowForwardIosIcon className={styles.icon} />
                Başlığa qayıt
              </li>
              <li onClick={handleScroll}>
                <ArrowForwardIosIcon className={styles.icon} />
                Başlığa qayıt
              </li>
            </ul>
          </div> */}
        </div>
      </div>
      <a
        href="https://www.instagram.com/reverdigitallab.az?igsh=MTFvamdoOXN1dWxvZg=="
        target="_blank"
        className={styles.footerEnd}
        // style={path == "/" ? { display: "none" } : {}}
      >
        Developed by Rever Digital Lab
      </a>
      <AdSpace position="footer-bottom" />
    </>
  );
}

export default Footer;
