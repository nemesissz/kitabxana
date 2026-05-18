import { Outlet, useNavigate } from "react-router-dom";
import Header from "../Layouts/Header";
import Sidebar from "../Layouts/Sidebar";
import AnnouncementPopup from "../Components/AnnouncementPopup";
import { useContext, useEffect } from "react";
import dataContext from "../Contexts/GlobalState";
import useSessionTracker from "../hooks/useSessionTracker";

function MainRoute() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  useSessionTracker();
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
      <AnnouncementPopup />
      <Sidebar />
      <Header />
      <Outlet />
    </>
  );
}

export default MainRoute;
