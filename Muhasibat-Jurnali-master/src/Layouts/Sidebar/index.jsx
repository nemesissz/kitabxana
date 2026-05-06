import { useNavigate } from "react-router-dom";
import styles from "./index.module.scss";
import { useContext } from "react";
import dataContext from "../../Contexts/GlobalState";
import AdSpace from "../../Components/AdSpace";

function Sidebar() {
  const navigator = useNavigate();
  const store = useContext(dataContext);
  return (
    <>
      <div
        className={styles.glassSideBar}
        style={store.sidebar.data ? { display: "none" } : {}}
        onClick={() => {
          store.sidebar.setData(!store.sidebar.data);
        }}
      ></div>
      <div
        className={styles.sideBar}
        style={store.sidebar.data ? { right: "-100%" } : {}}
      >
        <AdSpace position="sidebar-top" />
        <ul>
          <li
            onClick={() => {
              navigator("/");
              store.sidebar.setData(!store.sidebar.data);
            }}
            style={
              window.location.pathname == "/"
                ? { color: "#032062", backgroundColor: "white" }
                : {}
            }
          >
            Ana səhifə
          </li>
          <li
            onClick={() => {
              navigator("/");
              store.sidebar.setData(!store.sidebar.data);
            }}
            style={
              window.location.pathname == "/"
                ? { color: "#032062", backgroundColor: "white" }
                : {}
            }
          >
            Kitabxana
          </li>
          <li
            onClick={() => {
              navigator("/cv-templates");
              store.sidebar.setData(!store.sidebar.data);
            }}
            style={
              window.location.pathname == "/cv-templates"
                ? { color: "#032062", backgroundColor: "white" }
                : {}
            }
          >
            CV Numunələri
          </li>

          <li
            onClick={() => {
              navigator("/services");
              store.sidebar.setData(!store.sidebar.data);
            }}
            style={
              window.location.pathname == "/services"
                ? { color: "#032062", backgroundColor: "white" }
                : {}
            }
          >
            Servislər
          </li>
          <li
            onClick={() => {
              navigator("/news");
              store.sidebar.setData(!store.sidebar.data);
            }}
            style={
              window.location.pathname == "/news"
                ? { color: "#032062", backgroundColor: "white" }
                : {}
            }
          >
            Xəbərlər
          </li>
          <li
            onClick={() => {
              navigator("/calculator");
              store.sidebar.setData(!store.sidebar.data);
            }}
            style={
              window.location.pathname == "/calculator"
                ? { color: "#032062", backgroundColor: "white" }
                : {}
            }
          >
            Kalkulyator
          </li>
          {/* <li></li> */}

          <select
            defaultValue=""
            onChange={(e) => {
              e.preventDefault();
              store.sidebar.setData(!store.sidebar.data);
              navigator(`${e.target.value}`);
              e.target.value = "";
            }}
          >
            <option value="" hidden>
              Hüquqi məlumatlar
            </option>
            <option value="/term-of-use">İstifadə şərtləri</option>
            <option value="/privacy-policy">Məxfilik siyasəti</option>
            <option value="/copyright">Müəllif hüquqları</option>
          </select>
                    <li
            className={styles.person}
            onClick={() => {
              if (store.user.data) {
                navigator("/profile");
              } else {
                navigator("/login");
              }
              store.sidebar.setData(!store.sidebar.data);
            }}
            style={
              window.location.pathname == "/calculator"
                ? { color: "#032062", backgroundColor: "white" }
                : {}
            }
          >
            Profil
          </li>
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
