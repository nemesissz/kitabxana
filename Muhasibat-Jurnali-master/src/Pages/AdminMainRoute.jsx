import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../Layouts/AdminSideBar";
import AdminHeader from "../Layouts/AdminHeader";
import AdminLoader from "../Components/AdminLoader";

function AdminMainRoute() {
  const navigate = useNavigate();
  function handleCtrlL(event) {
    if (event.ctrlKey && event.key === "e") {
      event.preventDefault();
      console.log("first");
      navigate("/");
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleCtrlL);
    return () => {
      window.removeEventListener("keydown", handleCtrlL);
    };
  }, []);
  return (
    <div style={{ display: "flex" }}>
      <AdminSidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <AdminHeader />
        <div
          style={{
            overflowY: "scroll",
            height: "calc(100vh - 60px)", // Adjust height based on header height
          }}
          className="custom-scrollbar"
        >
          <AdminLoader />
          <Outlet />
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2c3e50;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fff;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #2c3e50 #fff;
        }
      `}</style>
    </div>
  );
}

export default AdminMainRoute;
