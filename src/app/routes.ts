import { createBrowserRouter } from "react-router";
import { Catalog } from "./components/Catalog";
import { RootLayout } from "./components/RootLayout";
import { NotFound } from "./components/NotFound";
import { Login } from "./components/Login";
import { BookManagement } from "./components/BookManagement";
import { UserManagement } from "./components/UserManagement";
import { LoansAndReturns } from "./components/LoansAndReturns";
import { LoanRequests } from "./components/LoanRequests";
import { FinesManagement } from "./components/FinesManagement";
import { Dashboard } from "./components/Dashboard";
import { SettingsConfig } from "./components/SettingsConfig";
import { MyBooks } from "./components/MyBooks";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Catalog },
      { path: "inicio", Component: Dashboard },
      { path: "mis-libros", Component: MyBooks },
      { path: "prestamos", Component: LoansAndReturns },
      { path: "solicitudes", Component: LoanRequests },
      { path: "multas", Component: FinesManagement },
      { path: "gestion-libros", Component: BookManagement },
      { path: "gestion-usuarios", Component: UserManagement },
      { path: "config", Component: SettingsConfig },
      { path: "*", Component: NotFound },
    ],
  },
]);