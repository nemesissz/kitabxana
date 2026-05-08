import React, { useEffect } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import AdminSidebar from "../Layouts/AdminSideBar";
import AdminHeader from "../Layouts/AdminHeader";
import AdminLoader from "../Components/AdminLoader";

function AdminMainRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCtrlL = (event) => {
      if (event.ctrlKey && event.key === "e") {
        event.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleCtrlL);
    return () => window.removeEventListener("keydown", handleCtrlL);
  }, [navigate]);

  // Sinxron yoxlama — render-dən əvvəl işləyir, flash olmur
  const tokenAdmin = localStorage.getItem("tokenAdmin");
  const adminID = localStorage.getItem("admin");
  if (!tokenAdmin || !adminID) {
    return <Navigate to="/admin/login" replace />;
  }

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
            height: "calc(100vh - 60px)",
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
