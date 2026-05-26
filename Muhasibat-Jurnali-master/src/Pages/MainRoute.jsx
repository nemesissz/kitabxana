import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "../Layouts/Header";
import Sidebar from "../Layouts/Sidebar";
import AnnouncementPopup from "../Components/AnnouncementPopup";
import { useContext, useEffect } from "react";
import dataContext from "../Contexts/GlobalState";
import useSessionTracker from "../hooks/useSessionTracker";
import axios from "axios";
import Base_Url_Server from "../Constants/baseUrl";

function MainRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useContext(dataContext);
  const hideChrome = ["/login", "/register"].includes(location.pathname);
  useSessionTracker();

  // Page reload-dan sonra user vəziyyətini bərpa et
  useEffect(() => {
    if (store.user.data) return;
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) return;
    axios
      .get(Base_Url_Server + "users/" + userID, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => store.user.setData(res.data.data.user))
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          store.user.setData(null);
        }
      });
  }, []);

  function handleCtrlL(event) {
    if (event.ctrlKey && event.key === "d") {
      event.preventDefault();
      navigate("admin/login");
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleCtrlL);
    return () => {
      window.removeEventListener("keydown", handleCtrlL);
    };
  }, []);
  return (
    <>
      {!hideChrome && <AnnouncementPopup />}
      {!hideChrome && <Sidebar />}
      {!hideChrome && <Header />}
      <Outlet />
    </>
  );
}

export default MainRoute;
