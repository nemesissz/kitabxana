import React, { useState } from "react";
import styles from "./index.module.scss";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Footer from "../../Layouts/Footer";

function TermsOfUsePage() {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1>İstifadə Şərtləri</h1>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("general")}
            >
              <h2>1. Ümumi Müddəalar</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.general ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.general && (
              <div className={styles.sectionContent}>
                <p>
                  Bu platformada yazıçıların xəbərləri, kitabları və məcəllələri
                  dərc olunur. Saytdan istifadə etməklə siz aşağıdakı şərtləri
                  qəbul edirsiz.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("account")}
            >
              <h2>2. İstifadəçi Hesabı</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.account ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.account && (
              <div className={styles.sectionContent}>
                <p>
                  Hesab yaratmaq üçün aşağıdakı məlumatları təqdim etməlisiniz:
                </p>
                <ul>
                  <li>Ad və Soyad</li>
                  <li>Elektron poçt ünvanı</li>
                  <li>Telefon nömrəsi</li>
                  <li>Şirkət məlumatları (tələb olunarsa)</li>
                  <li>Vəzifə məlumatları</li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("payment")}
            >
              <h2>3. Ödəniş Şərtləri</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.payment ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.payment && (
              <div className={styles.sectionContent}>
                <p>
                  Premium məzmuna çıxış üçün ödəniş etməli olacaqsınız. Bütün
                  ödənişlər təhlükəsiz ödəniş sistemləri vasitəsilə həyata
                  keçirilir.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("content")}
            >
              <h2>4. Məzmun İstifadəsi</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.content ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.content && (
              <div className={styles.sectionContent}>
                <p>
                  Saytdakı bütün məzmun müəllif hüquqları ilə qorunur. İcazəsiz
                  surətdəçıxarmaq və ya paylaşmaq qadağandır.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("responsibility")}
            >
              <h2>5. Məsuliyyət</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.responsibility ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.responsibility && (
              <div className={styles.sectionContent}>
                <p>
                  Platformada dərc olunan məlumatların düzgünlüyünə görə
                  məsuliyyət daşıyırıq. Lakin istifadəçi məlumatlarının
                  təhlükəsizliyi üçün də lazımi tədbirlər görürük.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("changes")}
            >
              <h2>6. Şərtlərin Dəyişdirilməsi</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.changes ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.changes && (
              <div className={styles.sectionContent}>
                <p>
                  Bu şərtlər vaxtaşırı yenilənə bilər. Dəyişikliklər saytda elan
                  olunacaq və qüvvəyə minməsi barədə bildiriş göndəriləcək.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("contact")}
            >
              <h2>7. Əlaqə</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.contact ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.contact && (
              <div className={styles.sectionContent}>
                <p>Suallarınız olduqda bizimlə əlaqə saxlaya bilərsiniz.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}

export default TermsOfUsePage;
