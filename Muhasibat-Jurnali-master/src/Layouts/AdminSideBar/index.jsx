import React, { useContext, useState } from "react";
import styles from "./index.module.scss";
import HomeIcon from "@mui/icons-material/Home";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import PeopleIcon from "@mui/icons-material/People";
import dataContext from "../../Contexts/GlobalState";
import BackpackIcon from "@mui/icons-material/Backpack";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import CategoryIcon from "@mui/icons-material/Category";
import CloseIcon from "@mui/icons-material/Close";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CampaignIcon from "@mui/icons-material/Campaign";

function AdminSidebar() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [showCategoryMenu, setShowCategoryMenu] = useState(true);

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
              setShowCategoryMenu(true);
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
                  setShowCategoryMenu(true);
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
                  navigate("/admin/news");
                  store.adminSideBar.setData(false);
                  setShowCategoryMenu(true);
                }}
                style={
                  window.location.pathname === "/admin/news"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <NewspaperIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Xəbərlər</span>}
              </li>

              <li
                onClick={() => {
                  setShowCategoryMenu(true);
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

              <li
                onClick={() => {
                  navigate("/admin/services");
                  store.adminSideBar.setData(false);
                  setShowCategoryMenu(true);
                }}
                style={
                  window.location.pathname === "/admin/services"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <MiscellaneousServicesIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Servislər</span>}
              </li>

              <li
                onClick={() => {
                  navigate("/admin/users");
                  store.adminSideBar.setData(false);
                  setShowCategoryMenu(true);
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
                  navigate("/admin/subscriptions");
                  store.adminSideBar.setData(false);
                  setShowCategoryMenu(true);
                }}
                style={
                  window.location.pathname === "/admin/subscriptions"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <CardGiftcardIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Abunəliklər</span>}
              </li>

              <li
                onClick={() => {
                  navigate("/admin/ads");
                  store.adminSideBar.setData(false);
                  setShowCategoryMenu(true);
                }}
                style={
                  window.location.pathname === "/admin/ads"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <CampaignIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Reklamlar</span>}
              </li>

              <li
                onClick={() => {
                  setShowCategoryMenu(!showCategoryMenu);
                  store.adminSideBar.setData(true);
                  console.log(window.location.pathname);
                }}
                style={
                  window.location.pathname === "/admin/categories/books" ||
                  window.location.pathname === "/admin/categories/news"
                    ? { color: "#2c3e50", backgroundColor: "white" }
                    : {}
                }
              >
                <CategoryIcon className={styles.icon} />
                {store.adminSideBar.data && <span>Kateqoriyalar</span>}
              </li>
            </ul>
          </div>
        </div>

        <div>
          <li
            className={styles.logoutBtn}
            onClick={() => {
              navigate("/");
            }}
          >
            <LogoutIcon className={styles.icon} />
            {store.adminSideBar.data && <span>Sayta qayıt</span>}
          </li>
        </div>
      </div>
      <div
        className={`${styles.categoryPanel} ${
          showCategoryMenu ? styles.open : ""
        }`}
        // style={showCategoryMenu ? { right: "100" } : {right : "-200px"}}
      >
        <div className={styles.categoryHeader}>
          <h3>Kateqoriyalar</h3>
          <CloseIcon
            className={styles.closeIcon}
            onClick={() => {
              setShowCategoryMenu(true);
            }}
          />
        </div>
        <ul>
          <li
            style={
              window.location.pathname === "/admin/categories/books"
                ? { color: "#2c3e50", backgroundColor: "white" }
                : {}
            }
            onClick={() => {
              navigate("/admin/categories/books");
              setShowCategoryMenu(true);
              store.adminSideBar.setData(false);
            }}
          >
            <MenuBookIcon className={styles.icon} /> Kitab kateqoriyaları
          </li>
          <li
            style={
              window.location.pathname === "/admin/categories/news"
                ? { color: "#2c3e50", backgroundColor: "white" }
                : {}
            }
            onClick={() => {
              navigate("/admin/categories/news");
              setShowCategoryMenu(true);
              store.adminSideBar.setData(false);
            }}
          >
            <NewspaperIcon className={styles.icon} /> Xəbər kateqoriyaları
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AdminSidebar;
