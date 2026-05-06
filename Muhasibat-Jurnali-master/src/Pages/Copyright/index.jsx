import React, { useState } from "react";
import styles from "./index.module.scss";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Footer from "../../Layouts/Footer";

function CopyrightPage() {
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
          <h1>Müəllif Hüquqları</h1>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("ownership")}
            >
              <h2>1. Məzmun Mülkiyyəti</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.ownership ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.ownership && (
              <div className={styles.sectionContent}>
                <p>
                  Bu platformada dərc olunan bütün kitablar, məqalələr, xəbərlər
                  və digər məzmun müəllif hüquqları ilə qorunur. Hər bir əsərin
                  müəllif hüquqları müəllifə və ya hüquq sahibinə məxsusdur.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("permitted")}
            >
              <h2>2. İcazəli İstifadə</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.permitted ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.permitted && (
              <div className={styles.sectionContent}>
                <p>
                  Platformada mövcud məzmunu aşağıdakı şərtlərlə istifadə edə
                  bilərsiniz:
                </p>
                <ul>
                  <li>Şəxsi oxumaq və araşdırma məqsədilə</li>
                  <li>Təhsil məqsədilə məhdud istifadə</li>
                  <li>Mənbə göstərməklə qısa sitat vermək</li>
                  <li>Həcmi məhdud olmaqla akademik məqsədlər üçün</li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("forbidden")}
            >
              <h2>3. Qadağan Olan Fəaliyyətlər</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.forbidden ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.forbidden && (
              <div className={styles.sectionContent}>
                <p>Aşağıdakı fəaliyyətlər qəti surətdə qadağandır:</p>
                <ul>
                  <li>Məzmunu icazəsiz kopyalamaq və paylaşmaq</li>
                  <li>Kommersiya məqsədilə istifadə etmək</li>
                  <li>Məzmunu başqa platformalarda yenidən dərc etmək</li>
                  <li>Müəlliflik hüquqlarını pozub öz adınıza vermək</li>
                  <li>Məzmunu dəyişdirərək paylaşmaq</li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("platform")}
            >
              <h2>4. Platformanın Hüquqları</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.platform ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.platform && (
              <div className={styles.sectionContent}>
                <p>
                  Bu platformanın dizaynı, loqosu, tərtibatı və texniki həlli
                  bizim müəllif hüquqlarımızla qorunur. Platform adı və brendinq
                  elementləri bizim ticarət nişanlarımızdır.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("userContent")}
            >
              <h2>5. İstifadəçi Məzmunu</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.userContent ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.userContent && (
              <div className={styles.sectionContent}>
                <p>
                  İstifadəçilərin platforma yüklədiyi məzmun onların öz müəllif
                  hüquqlarında qalır. Lakin platformada dərc etməklə onlar bizə
                  məhdud istifadə lisenziyası verirlər.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("violation")}
            >
              <h2>6. Hüquq Pozuntusu Bildirişi</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.violation ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.violation && (
              <div className={styles.sectionContent}>
                <p>
                  Əgər sizin müəllif hüquqlarınızın pozulduğunu düşünürsünüzsə,
                  bizimlə əlaqə saxlayın. Biz iddiaları ciddi şəkildə araşdırır
                  və lazımi tədbirləri görürük.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("international")}
            >
              <h2>7. Beynəlxalq Hüquqlar</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.international ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.international && (
              <div className={styles.sectionContent}>
                <p>
                  Bu platform Azərbaycan Respublikasının qanunlarına tabedir.
                  Müəllif hüquqları beynəlxalq konvensiyalar əsasında qorunur.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("contact")}
            >
              <h2>8. Əlaqə Məlumatları</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.contact ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.contact && (
              <div className={styles.sectionContent}>
                <p>
                  Müəllif hüquqları ilə bağlı suallar üçün bizimlə əlaqə
                  saxlayın. Bütün müraciətlər 48 saat ərzində cavablandırılır.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CopyrightPage;
