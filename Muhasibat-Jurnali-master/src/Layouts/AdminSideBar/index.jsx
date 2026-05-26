import React, { useContext, useEffect, useRef } from "react";
import styles from "./index.module.scss";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TuneIcon from "@mui/icons-material/Tune";
import PeopleIcon from "@mui/icons-material/People";
import dataContext from "../../Contexts/GlobalState";
import BackpackIcon from "@mui/icons-material/Backpack";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import CategoryIcon from "@mui/icons-material/Category";
import HistoryIcon from "@mui/icons-material/History";
import CampaignIcon from "@mui/icons-material/Campaign";
import BusinessIcon from "@mui/icons-material/Business";
import TranslateIcon from "@mui/icons-material/Translate";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";

const POLL_INTERVAL = 30000;

function Badge({ count, expanded }) {
  if (!count) return null;
  if (!expanded) return <span className={styles.badgeDot} />;
  return <span className={styles.badge}>{count > 99 ? "99+" : count}</span>;
}

function AdminSidebar() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const isSuperAdmin = (store.admin.data?.role || 0) >= 4;
  const isWorker = (store.admin.data?.role || 0) === 2;
  const notif = store.adminNotifications.data;
  const timerRef = useRef(null);

  const fetchCounts = () => {
    const token = localStorage.getItem("tokenAdmin");
    if (!token) return;
    axios
      .get(`${Base_Url_Server}admin/pending-counts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => store.adminNotifications.setData(r.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCounts();
    timerRef.current = setInterval(fetchCounts, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, []);


  return (
    <div
      className={styles.sidebarContainer}
      style={store.adminSideBar.data ? {} : { width: "75px" }}
    >
      <div className={styles.sidebar}>
        <div className={styles.top}>
          <div
            className={styles.title}
            onClick={() => {
              store.adminSideBar.setData(!store.adminSideBar.data);
            }}
          >
            <BackpackIcon className={styles.icon} />
            {store.adminSideBar.data && <h2>Admin Panel</h2>}
          </div>

          <div className={styles.navigation}>
            <ul>
              <li
                onClick={() => {
                  navigate("/admin");
                  store.adminSideBar.setData(false);

                }}
                style={
                  window.location.pathname === "/admin"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <HomeIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Ana Səhifə</span>}
              </li>

              <li
                onClick={() => {

                  store.adminSideBar.setData(false);
                  navigate("/admin/library");
                }}
                style={
                  window.location.pathname === "/admin/library"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <MenuBookIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Kitablar</span>}
              </li>

              {isSuperAdmin && (
                <li
                  onClick={() => {
                    navigate("/admin/services");
                    store.adminSideBar.setData(false);
                  }}
                  style={
                    window.location.pathname === "/admin/services"
                      ? { color: "#2c3e50", backgroundColor: "white" }
                      : {}
                  }
                >
                  <TuneIcon className={styles.icon} />
                  {store.adminSideBar.data && <span>Parametrlər</span>}
                </li>
              )}

              <li
                onClick={() => {
                  navigate("/admin/users");
                  store.adminSideBar.setData(false);

                }}
                style={
                  window.location.pathname === "/admin/users"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <PeopleIcon className={styles.icon} />
                {store.adminSideBar.data && <span>İstifadəçilər</span>}
              </li>

              <li
                onClick={() => {
                  navigate("/admin/history");
                  store.adminSideBar.setData(false);

                }}
                style={
                  window.location.pathname === "/admin/history"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <HistoryIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Tarixçə</span>}
              </li>

              {!isWorker && (
                <li
                  onClick={() => {
                    navigate("/admin/ads");
                    store.adminSideBar.setData(false);
                  }}
                  style={
                    window.location.pathname === "/admin/ads"
                      ? { color: "#2c3e50", backgroundColor: "white" }
                      : {}
                  }
                >
                  <CampaignIcon className={styles.icon} />
                  {store.adminSideBar.data && <span>Elanlar</span>}
                </li>
              )}

              <li
                onClick={() => {
                  navigate("/admin/categories/books");
                  store.adminSideBar.setData(false);
                }}
                style={
                  window.location.pathname === "/admin/categories/books"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
                className={styles.navItem}
              >
                <CategoryIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Kateqoriyalar</span>}
                <Badge count={notif.categoryRequests} expanded={store.adminSideBar.data} />
              </li>

              <li
                onClick={() => {
                  navigate("/admin/languages");
                  store.adminSideBar.setData(false);
                }}
                style={
                  window.location.pathname === "/admin/languages"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <TranslateIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Dillər</span>}
              </li>

              {isSuperAdmin && (
                <li
                  onClick={() => {
                    navigate("/admin/institutions");
                    store.adminSideBar.setData(false);
                  }}
                  style={
                    window.location.pathname === "/admin/institutions"
                      ? { color: "#2c3e50", backgroundColor: "white" }
                      : {}
                  }
                >
                  <BusinessIcon className={styles.icon} />
                  {store.adminSideBar.data && <span>Müəssisələr</span>}
                </li>
              )}

              <li
                onClick={() => {
                  navigate("/admin/rentals");
                  store.adminSideBar.setData(false);
                }}
                style={
                  window.location.pathname === "/admin/rentals"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
                className={styles.navItem}
              >
                <BookmarkIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Kirayə Sorğuları</span>}
                <Badge count={notif.rentals} expanded={store.adminSideBar.data} />
              </li>
            </ul>
          </div>
        </div>

        <div>
          <li
            className={styles.logoutBtn}
            onClick={() => {
              const tokenAdmin = localStorage.getItem("tokenAdmin");
              const adminID = localStorage.getItem("admin");
              if (tokenAdmin && adminID && !localStorage.getItem("token")) {
                localStorage.setItem("token", tokenAdmin);
                localStorage.setItem("user", adminID);
              }
              navigate("/");
            }}
          >
            <LogoutIcon className={styles.icon} />
            {store.adminSideBar.data && <span>Sayta qayıt</span>}
          </li>
        </div>
      </div>
    </div>
  );
}

export default AdminSidebar;
