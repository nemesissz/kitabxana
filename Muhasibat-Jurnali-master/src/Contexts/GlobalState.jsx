import { createContext, useState } from "react";

const dataContext = createContext();

export const DataProvider = ({ children }) => {
  const [sidebar, setSidebar] = useState(true);
  const [adminSideBar, setAdminSideBar] = useState(true);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loader, setLoader] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState({ rentals: 0, categoryRequests: 0 });

  const store = {
    loader: {
      data: loader,
      setData: setLoader,
    },
    admin: {
      data: admin,
      setData: setAdmin,
    },
    sidebar: {
      data: sidebar,
      setData: setSidebar,
    },
    adminSideBar: {
      data: adminSideBar,
      setData: setAdminSideBar,
    },
    user: {
      data: user,
      setData: setUser,
    },
    adminNotifications: {
      data: adminNotifications,
      setData: setAdminNotifications,
    },
  };

  return <dataContext.Provider value={store}>{children}</dataContext.Provider>;
};

export default dataContext;
