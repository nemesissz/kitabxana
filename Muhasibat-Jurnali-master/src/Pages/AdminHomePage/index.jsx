import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function AdminHomePage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);

  const tokenAdmin = localStorage.getItem("tokenAdmin");
  const adminID = localStorage.getItem("admin");
  const calcMonthlyRevenue = () => {
    let total = 0;
    dashboard?.monthlyRevenue?.forEach((e) => {
      total = total + e.amount;
    });
    return total;
  };

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
      .catch(() => {
        store.admin.setData(null);
        localStorage.removeItem("tokenAdmin");
        localStorage.removeItem("admin");
        navigate("/admin/login");
      });
  }, [tokenAdmin, adminID]);

  useEffect(() => {
    store.loader.setData(true);
    const fetchData = async () => {
      try {
        const [dashboardRes] = await Promise.all([
          axios.get(Base_Url_Server + "admin/dashboard", {
            headers: { Authorization: `Bearer ${tokenAdmin}` },
          }),
        ]);
        setDashboard(dashboardRes.data.data);
      } catch (err) {
        console.log("Dashboard yüklənmədi:", err);
      } finally {
        store.loader.setData(false);
      }
    };
    fetchData();
  }, [tokenAdmin]);
  const chartSetting = {
    xAxis: [
      {
        label: "rainfall (mm)",
      },
    ],
    height: 400,
    margin: { left: 0 },
  };

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <h3>Ümumi İstifadəçi</h3>
          <p>{dashboard?.totalUsers || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Aktiv Abunələr</h3>
          <p>{dashboard?.activeSubscriptions || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Ümumi Abunəlik</h3>
          <p>{dashboard?.totalSubscriptions || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Toplam PDF sayı</h3>
          <p>{dashboard?.totalPdfs || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Toplam Yüklənmə</h3>
          <p>{dashboard?.totalDownloads || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Ümumi Gəlir</h3>
          <p>{dashboard?.totalRevenue || 0} AZN</p>
        </div>
      </div>

      {/* Yeni statistikalar */}
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
        <div className={styles.statBox}>
          <h3>Aktiv xəbər sayı</h3>
          <p>{dashboard?.activeNewsCount || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Toplam ödənişlərin sayı</h3>
          <p>{dashboard?.totalPayments || 0}</p>
        </div>
        <div className={styles.statBox}>
          <h3>Aktiv xidmətlər</h3>
          <p>{dashboard?.activeServicesCount || 0}</p>
        </div>
      </div>

      {/* .edu domain statistikaları */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statBox} ${styles.eduBox}`}>
          <h3>🎓 .edu domain istifadəçiləri</h3>
          <p>{dashboard?.eduDomainUsers || 0}</p>
        </div>
        <div className={`${styles.statBox} ${styles.eduBox}`}>
          <h3>Son 30 gündə .edu qeydiyyat</h3>
          <p>{dashboard?.newEduUsersLast30Days || 0}</p>
        </div>
      </div>

      {/* Gəlir statistikalari */}
      <div className={styles.revenueSection}>
        <h2>📊 Gəlir Statistikalari</h2>
        <div className={styles.revenueGrid}>
          <div className={styles.revenueBox}>
            <h3>Bu ayın gəliri</h3>
            <p className={styles.revenueAmount}>{dashboard?.thisMonthRevenue || 0} AZN</p>
            {dashboard?.revenueGrowthPercent && (
              <span className={parseFloat(dashboard.revenueGrowthPercent) >= 0 ? styles.positive : styles.negative}>
                {dashboard.revenueGrowthPercent > 0 ? '↑' : '↓'} {Math.abs(dashboard.revenueGrowthPercent)}%
              </span>
            )}
          </div>
          <div className={styles.revenueBox}>
            <h3>Keçən ayın gəliri</h3>
            <p className={styles.revenueAmount}>{dashboard?.lastMonthRevenue || 0} AZN</p>
          </div>
          <div className={styles.revenueBox}>
            <h3>Son 7 günün gəliri</h3>
            <p className={styles.revenueAmount}>{dashboard?.revenueLast7Days || 0} AZN</p>
          </div>
        </div>
      </div>
      <div className={styles.monthlyStats}>
        <div className={styles.monthBox}>
          <h3>Aylıq gəlirlər</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={dashboard?.monthlyRevenue}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => [`${v} AZN`, "Məbləğ"]} />
                <Bar dataKey="amount" fill="#334155" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className={styles.categoryStats}>
        <h3>📚 PDF statistikaları</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>№</th>
              <th>Kateqoriya</th>
              <th>PDF Sayı</th>
              <th>Yüklənmələr</th>
            </tr>
          </thead>
          <tbody>
            {dashboard?.categoryStats?.map((cat, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{cat.name}</td>
                <td>{cat.pdfCount}</td>
                <td>{cat.totalDownloads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ən çox yüklənən PDF-lər */}
      {dashboard?.topPdfs && dashboard.topPdfs.length > 0 && (
        <div className={styles.topPdfsSection}>
          <h3>🔥 Ən çox yüklənən PDF-lər</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>PDF Başlığı</th>
                <th>Yüklənmə sayı</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.topPdfs.map((pdf, i) => (
                <tr key={pdf.id}>
                  <td>{i + 1}</td>
                  <td>{pdf.title}</td>
                  <td>{pdf.downloads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Son ödənişlər */}
      {dashboard?.recentPayments && dashboard.recentPayments.length > 0 && (
        <div className={styles.recentPaymentsSection}>
          <h3>💳 Son Ödənişlər</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>İstifadəçi</th>
                <th>Məbləğ</th>
                <th>Tip</th>
                <th>Tarix</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentPayments.map((payment, i) => (
                <tr key={payment.id}>
                  <td>{i + 1}</td>
                  <td>{payment.user_email}</td>
                  <td>{payment.amount} AZN</td>
                  <td>{payment.type || payment.pdf_title || 'N/A'}</td>
                  <td>{new Date(payment.created_at).toLocaleDateString('az-AZ')}</td>
                  <td><span className={payment.status === 'success' ? styles.success : styles.pending}>{payment.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Abunə planları bölgüsü */}
      {dashboard?.subscriptionPlanDistribution && dashboard.subscriptionPlanDistribution.length > 0 && (
        <div className={styles.subscriptionDistribution}>
          <h3>📊 Abunə Planları Bölgüsü</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>Plan</th>
                <th>İstifadəçi sayı</th>
                <th>Ümumi gəlir</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.subscriptionPlanDistribution.map((plan, i) => (
                <tr key={plan.plan}>
                  <td>{i + 1}</td>
                  <td>{plan.plan}</td>
                  <td>{plan.count}</td>
                  <td>{plan.totalRevenue} AZN</td>
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
