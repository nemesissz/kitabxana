import { createBrowserRouter } from "react-router-dom";
import NewsPage from "../Pages/NewsPage";
import MainRoute from "../Pages/MainRoute";
import LibraryPage from "../Pages/LibraryPage";
import CategoryLibraryPage from "../Pages/CategoryLibraryPage";
import HomePage from "../Pages/Homepage";
import AboutPage from "../Pages/About";
import AdminHomePage from "../Pages/AdminHomePage";
import AdminMainRoute from "../Pages/AdminMainRoute";
import AdminLibraryPage from "../Pages/AdminLibraryPage";
import AdminServicesPage from "../Pages/AdminServicesPage";
import AdminUsersPage from "../Pages/AdminUsersPage";
import AddNewsPage from "../Pages/AddNewsPage";
import AddBookPage from "../Pages/AddBookPage";
import AddUserPage from "../Pages/AddUserPage";
import AdminProfilePage from "../Pages/AdminProfilePage";
import LoginPage from "../Pages/LoginPage";
import ProfilPage from "../Pages/ProfilPage";
import AdminLoginPage from "../Pages/AdminLoginPage";
import RegisterPage from "../Pages/RegisterPage";
import PdfReaderPage from "../Pages/PdfReaderPage";
import AdminCategoryPage from "../Pages/AdminCategoryPage";
import AdminCategoryPagePdfs from "../Pages/AdminCategoryPdfPage";
import PDFDetailPage from "../Pages/PDFDetailPage";
import NewsDetailPage from "../Pages/NewsDetailPage";
import AdminHistoryPage from "../Pages/AdminHistoryPage";
import AdminAdsPage from "../Pages/AdminAdsPage";
import UserSubmitPdfPage from "../Pages/UserSubmitPdfPage";
import AllPdfsPage from "../Pages/AllPdfsPage";
import AnnouncementsPage from "../Pages/AnnouncementsPage";
import AdminInstitutionsPage from "../Pages/AdminInstitutionsPage";
import AdminLanguagesPage from "../Pages/AdminLanguagesPage";
import AdminRentalsPage from "../Pages/AdminRentalsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainRoute />,
    children: [
      {
        path: "",
        element: <HomePage />,
      },
      {
        path: "news",
        element: <NewsPage />,
      },
      {
        path: "library",
        element: <LibraryPage />,
      },
      {
        path: "library/category/:categoryId",
        element: <CategoryLibraryPage />,
      },
      {
        path: "library/submit",
        element: <UserSubmitPdfPage />,
      },
      {
        path: "library/all",
        element: <AllPdfsPage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "profile",
        element: <ProfilPage />,
      },
      {
        path: "library/:id",
        element: <PDFDetailPage />,
      },
      {
        path: "news/:id",
        element: <NewsDetailPage />,
      },
      {
        path: "announcements",
        element: <AnnouncementsPage />,
      },
    ],
  },
  {
    path: "/admin/",
    element: <AdminMainRoute />,
    children: [
      {
        path: "",
        element: <AdminHomePage />,
      },
      {
        path: "library",
        element: <AdminLibraryPage />,
      },
      {
        path: "services",
        element: <AdminServicesPage />,
      },
      {
        path: "users",
        element: <AdminUsersPage />,
      },
      {
        path: "add-news",
        element: <AddNewsPage />,
      },
      {
        path: "add-book",
        element: <AddBookPage />,
      },
      {
        path: "add-user",
        element: <AddUserPage />,
      },
      {
        path: "profile",
        element: <AdminProfilePage />,
      },
      {
        path: "categories/news",
        element: <AdminCategoryPage />,
      },
      {
        path: "categories/books",
        element: <AdminCategoryPagePdfs />,
      },
      {
        path: "history",
        element: <AdminHistoryPage />,
      },
      {
        path: "ads",
        element: <AdminAdsPage />,
      },
      {
        path: "institutions",
        element: <AdminInstitutionsPage />,
      },
      {
        path: "languages",
        element: <AdminLanguagesPage />,
      },
      {
        path: "rentals",
        element: <AdminRentalsPage />,
      },
    ],
  },
  {
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  {
    path: "/library/:id/read",
    element: <PdfReaderPage />,
  },
]);

export default router;
