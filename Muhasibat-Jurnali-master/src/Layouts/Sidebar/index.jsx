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
          {/* <li></li> */}

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
              window.location.pathname == "/profile"
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
