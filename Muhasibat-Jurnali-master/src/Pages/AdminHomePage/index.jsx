import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";

const fmtTime = (s) => {
  if (!s) return "0 dəq";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} s ${m} dəq`;
  return `${m} dəq`;
};

function AdminHomePage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [topPdfSort, setTopPdfSort] = useState("downloads");
  const [timeScope, setTimeScope] = useState("all");
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(monthStr);
  const [periodData, setPeriodData] = useState(null);

  const tokenAdmin = localStorage.getItem("tokenAdmin");
  const adminID = localStorage.getItem("admin");

  const adminRole = store.admin.data?.role ?? 0;
  const adminInstitutionId = store.admin.data?.institutionId ?? null;
  const adminIsMain = institutions.find(i => i.id === adminInstitutionId)?.is_main;
  const isGlobalScope = institutions.length > 0
    ? (adminRole >= 4 || (adminRole >= 3 && adminInstitutionId && adminIsMain))
    : adminRole >= 4;

  useEffect(() => {
    if (!tokenAdmin || !adminID) {
      store.admin.setData(null);
      navigate("/admin/login");
      return;
    }

    axios
      .get(Base_Url_Server + "users/" + adminID, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      })
      .then((res) => store.admin.setData(res.data.data.user))
      .catch((error) => {
        if (error.response?.status === 401) {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          navigate("/admin/login");
        }
      });
  }, [tokenAdmin, adminID]);

  useEffect(() => {
    if (!tokenAdmin) return;
    axios
      .get(Base_Url_Server + "institutions", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      })
      .then((r) => setInstitutions(r.data.data.institutions || []))
      .catch(() => {});
  }, [tokenAdmin]);

  useEffect(() => {
    if (!tokenAdmin) return;
    store.loader.setData(true);
    const params = isGlobalScope && selectedInstitution
      ? { institutionId: selectedInstitution }
      : {};
    axios
      .get(Base_Url_Server + "admin/dashboard", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        params,
      })
      .then((res) => setDashboard(res.data.data))
      .catch((err) => console.log("Dashboard yüklənmədi:", err))
      .finally(() => store.loader.setData(false));
  }, [tokenAdmin, selectedInstitution]);

  useEffect(() => {
    if (!tokenAdmin) return;
    if (timeScope !== "today" && timeScope !== "month") return;
    const period = timeScope === "today" ? "day" : "month";
    const value  = timeScope === "today" ? selectedDay : selectedMonth;
    axios
      .get(Base_Url_Server + "sessions/stats/period", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        params: { period, value },
      })
      .then((res) => setPeriodData(res.data.data))
      .catch(() => setPeriodData(null));
  }, [tokenAdmin, timeScope, selectedDay, selectedMonth]);

  return (
    <div className={styles.container}>

      {/* Müəssisə filteri — yalnız global-scope adminlər üçün */}
      {isGlobalScope && institutions.length > 0 && (
        <div className={styles.filterBar}>
          <label className={styles.filterLabel}>Müəssisə:</label>
          <select
            className={styles.filterSelect}
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
          >
            <option value="">Hamısı</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Əsas statistikalar */}
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <h3>Ümumi İstifadəçi</h3>
          <p>{dashboard?.totalUsers || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Toplam PDF sayı</h3>
          <p>{dashboard?.totalPdfs || 0}</p>
        </div>
        <div className={`${styles.statBox} ${styles.statGreen}`}>
          <h3>Təsdiqlənmiş PDF</h3>
          <p>{dashboard?.approvedPdfs || 0}</p>
        </div>
        <div className={`${styles.statBox} ${styles.statYellow}`}>
          <h3>Gözləyən PDF</h3>
          <p>{dashboard?.pendingPdfs || 0}</p>
        </div>
        <div className={`${styles.statBox} ${styles.statRed}`}>
          <h3>Rədd edilmiş PDF</h3>
          <p>{dashboard?.rejectedPdfs || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Toplam Yüklənmə</h3>
          <p>{dashboard?.totalDownloads || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Elan sayı</h3>
          <p>{dashboard?.activeNewsCount || 0}</p>
        </div>
      </div>

      {/* Son 30 gün */}
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <h3>Son 30 gündə yeni istifadəçilər</h3>
          <p>{dashboard?.newUsersLast30Days || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Son 30 gündə yeni PDF</h3>
          <p>{dashboard?.newPdfsLast30Days || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Son 30 gündə yeni xəbərlər</h3>
          <p>{dashboard?.newNewsLast30Days || 0}</p>
        </div>
      </div>

      {/* Kateqoriya statistikaları */}
      <div className={styles.categoryStats}>
        <h3>📚 PDF statistikaları</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>№</th>
              <th>Kateqoriya</th>
              <th>PDF Sayı</th>
              <th>Yüklənmələr</th>
              <th>Oxunmalar</th>
            </tr>
          </thead>
          <tbody>
            {dashboard?.categoryStats?.map((cat, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{cat.name}</td>
                <td>{cat.pdfCount}</td>
                <td>{cat.totalDownloads}</td>
                <td>{cat.totalReads || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ən çox yüklənən/oxunan PDF-lər */}
      {(dashboard?.topPdfs?.length > 0 || dashboard?.topByReads?.length > 0) && (
        <div className={styles.topPdfsSection}>
          <div className={styles.topPdfsHeader}>
            <h3>
              {topPdfSort === "downloads" ? "🔥 Ən çox yüklənən PDF-lər" : "👁️ Ən çox oxunan PDF-lər"}
            </h3>
            <div className={styles.sortToggle}>
              <button
                className={`${styles.sortBtn} ${topPdfSort === "downloads" ? styles.sortActive : ""}`}
                onClick={() => setTopPdfSort("downloads")}
              >Yüklənmə</button>
              <button
                className={`${styles.sortBtn} ${topPdfSort === "reads" ? styles.sortActive : ""}`}
                onClick={() => setTopPdfSort("reads")}
              >Oxunma</button>
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>PDF Başlığı</th>
                <th>{topPdfSort === "downloads" ? "Yüklənmə sayı" : "Oxunma sayı"}</th>
              </tr>
            </thead>
            <tbody>
              {topPdfSort === "downloads"
                ? dashboard.topPdfs?.map((pdf, i) => (
                    <tr key={pdf.id}>
                      <td>{i + 1}</td>
                      <td>{pdf.title}</td>
                      <td>{pdf.downloads}</td>
                    </tr>
                  ))
                : dashboard.topByReads?.map((pdf, i) => (
                    <tr key={pdf.id}>
                      <td>{i + 1}</td>
                      <td>{pdf.title}</td>
                      <td>{pdf.reads}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Zaman statistikası — tab seçici */}
      <div className={styles.timeStatBlock}>
        <div className={styles.timeScopeHeader}>
          <div className={styles.timeScopeTabs}>
            {[["all","🕐 Ümumi"],["today","📅 Bu gün"],["month","📆 Bu ay"]].map(([val, label]) => (
              <button
                key={val}
                className={`${styles.timeScopeBtn} ${timeScope === val ? styles.timeScopeActive : ""}`}
                onClick={() => { setTimeScope(val); setPeriodData(null); }}
              >{label}</button>
            ))}
          </div>
          {timeScope === "today" && (
            <input
              type="date"
              className={styles.periodPicker}
              value={selectedDay}
              max={todayStr}
              onChange={(e) => setSelectedDay(e.target.value)}
            />
          )}
          {timeScope === "month" && (
            <input
              type="month"
              className={styles.periodPicker}
              value={selectedMonth}
              max={monthStr}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          )}
        </div>

        {(() => {
          const d = timeScope === "all"
            ? dashboard
            : (periodData || (timeScope === "today" ? dashboard?.todayStats : dashboard?.monthStats));
          return (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statBox}><h3>Ümumi Vaxt</h3><p>{fmtTime(d?.totalSeconds)}</p></div>
                <div className={styles.statBox}><h3>Sessiya Sayı</h3><p>{d?.totalSessions || 0}</p></div>
                <div className={styles.statBox}><h3>Anonim Ziyarətçi</h3><p>{d?.anonSessions || 0}</p></div>
                <div className={styles.statBox}><h3>Login Etmiş</h3><p>{d?.uniqueUsers || 0}</p></div>
              </div>
              {d?.topByTime?.length > 0 && (
                <table className={styles.table} style={{ marginTop: 12 }}>
                  <thead>
                    <tr><th>№</th><th>İstifadəçi</th><th>Vaxt</th></tr>
                  </thead>
                  <tbody>
                    {d.topByTime.map((u, i) => (
                      <tr key={u.login}>
                        <td>{i + 1}</td><td>{u.login}</td><td>{fmtTime(u.totalSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          );
        })()}
      </div>

      {/* Son 30 günün gündəlik statistikası */}
      {dashboard?.dailyChart && dashboard.dailyChart.length > 0 && (
        <div className={styles.topPdfsSection}>
          <h3>📊 Son 30 Günün Gündəlik Statistikası</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tarix</th>
                <th>Vaxt</th>
                <th>Sessiya</th>
                <th>Login Etmiş</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.dailyChart.map((row) => (
                <tr key={row.day}>
                  <td>{String(row.day).slice(0, 10)}</td>
                  <td>{fmtTime(row.totalSeconds)}</td>
                  <td>{row.sessions}</td>
                  <td>{row.uniqueUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Ən çox PDF yükləyən istifadəçilər */}
      {dashboard?.topUploaders && dashboard.topUploaders.length > 0 && (
        <div className={styles.topPdfsSection}>
          <h3>📤 Ən çox PDF yükləyən istifadəçilər</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>İstifadəçi adı</th>
                <th>PDF sayı</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.topUploaders.map((u, i) => (
                <tr key={u.login}>
                  <td>{i + 1}</td>
                  <td>{u.login}</td>
                  <td>{u.pdfCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export default AdminHomePage;
