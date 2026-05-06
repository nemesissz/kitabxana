import React, { useState } from "react";
import styles from "./index.module.scss";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Footer from "../../Layouts/Footer";

function PrivacyPolicyPage() {
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
          <h1>Məxfilik Siyasəti</h1>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("collection")}
            >
              <h2>1. Məlumatların Toplanması</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.collection ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.collection && (
              <div className={styles.sectionContent}>
                <p>
                  Bizim platforma istifadəçi təcrübəsini yaxşılaşdırmaq və
                  xidmətlərimizi təqdim etmək üçün müəyyən şəxsi məlumatları
                  toplayır. Bu məlumatlar qanuni əsaslarla və şəffaflıqla
                  toplanır.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("types")}
            >
              <h2>2. Toplanan Məlumat Növləri</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.types ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.types && (
              <div className={styles.sectionContent}>
                <h3>2.1 İstifadəçi Profil Məlumatları</h3>
                <p>Aşağıdakı şəxsi məlumatları toplayırıq:</p>
                <ul>
                  <li>
                    <strong>Ad və Soyad (full_name):</strong> Hesabınızı
                    fərdiləşdirmək və müraciət zamanı istifadə üçün
                  </li>
                  <li>
                    <strong>Telefon nömrəsi (phone):</strong> Təcili bildirişlər
                    və hesab təhlükəsizliyi üçün
                  </li>
                  <li>
                    <strong>Şirkət məlumatları (company):</strong> Korporativ
                    istifadəçilər üçün fatura və xidmət təyinatı
                  </li>
                  <li>
                    <strong>Vəzifə məlumatları (position):</strong> Müvafiq
                    məzmun və xidmətlərin təqdimi üçün
                  </li>
                  <li>
                    <strong>Hesab yaradılma tarixi (created_at):</strong> Hesab
                    tarixçəsi və statistika üçün
                  </li>
                  <li>
                    <strong>Son yeniləmə tarixi (updated_at):</strong>{" "}
                    Məlumatların aktual olmasını təmin etmək üçün
                  </li>
                </ul>

                <h3>2.2 İstifadəçi Hesab Məlumatları</h3>
                <ul>
                  <li>
                    <strong>Elektron poçt ünvanı (email):</strong> Hesaba giriş
                    və kommunikasiya üçün
                  </li>
                  <li>
                    <strong>Şifrə (password):</strong> Şifrələnmiş şəkildə
                    saxlanılır, heç kim görə bilməz
                  </li>
                  <li>
                    <strong>İstifadəçi rolu (role):</strong> Platformada
                    icazələrinizi müəyyən etmək üçün
                  </li>
                  <li>
                    <strong>Təsdiq statusu (is_verified):</strong> Hesabınızın
                    təsdiqlənməsi üçün
                  </li>
                  <li>
                    <strong>Təhsil e-poçtu (edu_email):</strong> Tələbə endirimi
                    və akademik istifadə üçün
                  </li>
                  <li>
                    <strong>Profil ID (profile_id):</strong> Profil məlumatları
                    ilə əlaqələndirmə üçün
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("usage")}
            >
              <h2>3. Məlumatların İstifadə Məqsədi</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.usage ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.usage && (
              <div className={styles.sectionContent}>
                <p>
                  Toplanan məlumatları aşağıdakı məqsədlər üçün istifadə edirik:
                </p>
                <ul>
                  <li>Hesabınızı yaratmaq və idarə etmək</li>
                  <li>Xidmətlərimizi təqdim etmək və fərdiləşdirmək</li>
                  <li>Ödəniş əməliyyatlarını həyata keçirmək</li>
                  <li>Müştəri dəstəyi təqdim etmək</li>
                  <li>Platformanın təhlükəsizliyini təmin etmək</li>
                  <li>Qanuni tələbləri yerinə yetirmək</li>
                  <li>Xidmətlərimizi təkmilləşdirmək</li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("security")}
            >
              <h2>4. Məlumatların Saxlanması və Təhlükəsizliyi</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.security ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.security && (
              <div className={styles.sectionContent}>
                <p>
                  Bütün şəxsi məlumatlar təhlükəsiz serverlərdə saxlanılır.
                  Şifrələr xüsusi alqoritmlə şifrələnir və heç kim onları görmək
                  iqtidarında deyil. Verilənlər bazamızda aşağıdakı
                  təhlükəsizlik tədbirləri tətbiq edilir:
                </p>
                <ul>
                  <li>256-bit SSL şifrələmə</li>
                  <li>Müntəzəm təhlükəsizlik auditləri</li>
                  <li>Məhdud çıxış nəzarəti</li>
                  <li>Avtomatik backup sistemləri</li>
                  <li>Fırıldaqçılıq monitorinqi</li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("sharing")}
            >
              <h2>5. Məlumatların Paylaşılması</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.sharing ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.sharing && (
              <div className={styles.sectionContent}>
                <p>
                  Şəxsi məlumatlarınızı üçüncü tərəflərlə paylaşmırıq. İstisna
                  hallar:
                </p>
                <ul>
                  <li>Sizin açıq razılığınız olduqda</li>
                  <li>Qanuni tələblər çərçivəsində</li>
                  <li>Ödəniş sistemləri ilə (yalnız lazım olan məlumatlar)</li>
                  <li>Texniki xidmət təqdimçiləri ilə (məhdud məlumatlar)</li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("rights")}
            >
              <h2>6. İstifadəçi Hüquqları</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.rights ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.rights && (
              <div className={styles.sectionContent}>
                <p>Şəxsi məlumatlarınızla bağlı aşağıdakı hüquqlarınız var:</p>
                <ul>
                  <li>Məlumatlarınızı görmək və yeniləmək</li>
                  <li>Məlumatlarınızın silinməsini tələb etmək</li>
                  <li>Məlumat emalını məhdudlaşdırmaq</li>
                  <li>Məlumatların portativliyini tələb etmək</li>
                  <li>İtirazlar və şikayətlər vermək</li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("cookies")}
            >
              <h2>7. Cookies və İzləmə</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.cookies ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.cookies && (
              <div className={styles.sectionContent}>
                <p>
                  Saytımızda istifadə təcrübəsini yaxşılaşdırmaq üçün cookies
                  istifadə edirik. Bu cookies texniki məlumatları toplayır və
                  şəxsiyyətinizi açıqlamır.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("retention")}
            >
              <h2>8. Məlumatların Saxlanma Müddəti</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.retention ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.retention && (
              <div className={styles.sectionContent}>
                <p>
                  Şəxsi məlumatlarınızı yalnız lazım olan müddət ərzində
                  saxlayırıq:
                </p>
                <ul>
                  <li>Aktiv hesablar: hesab aktiv olduqca</li>
                  <li>Deaktiv hesablar: 2 il sonra silinir</li>
                  <li>Ödəniş məlumatları: qanuni tələblər üzrə 7 il</li>
                  <li>Log məlumatları: 6 ay</li>
                </ul>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("children")}
            >
              <h2>9. Uşaqların Məxfiliyi</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.children ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.children && (
              <div className={styles.sectionContent}>
                <p>
                  Platformamız 13 yaşdan aşağı uşaqlar üçün nəzərdə tutulmayıb.
                  Belə istifadəçilərdən şəxsi məlumat toplamırıq.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("changes")}
            >
              <h2>10. Siyasətin Dəyişdirilməsi</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.changes ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.changes && (
              <div className={styles.sectionContent}>
                <p>
                  Bu məxfilik siyasəti vaxtaşırı yenilənə bilər. Əhəmiyyətli
                  dəyişikliklər barədə sizə bildirilərək razılığınız alınacaq.
                </p>
              </div>
            )}
          </div>

          <div className={styles.accordionSection}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("contact")}
            >
              <h2>11. Əlaqə</h2>
              <ExpandMoreIcon
                className={`${styles.expandIcon} ${
                  openSections.contact ? styles.expanded : ""
                }`}
              />
            </div>
            {openSections.contact && (
              <div className={styles.sectionContent}>
                <p>
                  Məxfilik siyasəti və şəxsi məlumatlarınızla bağlı suallarınız
                  üçün bizimlə əlaqə saxlayın. Bütün müraciətlər 24 saat ərzində
                  cavablandırılır.
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

export default PrivacyPolicyPage;
