import { Outlet, useNavigate } from "react-router-dom";
import Header from "../Layouts/Header";
import Sidebar from "../Layouts/Sidebar";
import { useContext, useEffect } from "react";
import dataContext from "../Contexts/GlobalState";

function MainRoute() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
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
      <Sidebar />
      <Header />
      <Outlet />
    </>
  );
}

export default MainRoute;
