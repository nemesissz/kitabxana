import { useContext, useEffect } from "react";
import styles from "./index.module.scss";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate } from "react-router-dom";
import dataContext from "../../Contexts/GlobalState";
function AdminHeader() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  useEffect(() => {
    document.title = "Admin Panel";
  }, []);
  return (
    <header className={styles.header}>
      <div
        className={styles.profile}
        onClick={() => navigate("/admin/profile")}
      >
        <PersonIcon className={styles.icon} />
        <span>{store.admin.data?.login}</span>
      </div>
    </header>
  );
}

export default AdminHeader;
