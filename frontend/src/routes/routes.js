// icons
import { MdHome, MdList, MdPeople } from "react-icons/md";

// pages
import LoginPage from "../pages/public/LoginScreen/LoginPage";
import ItemsPage from "../pages/private/Items/ItemsPage";
import ItemDetailPage from "../pages/private/Items/ItemDetailPage";
import UsersPage from "../pages/private/Users/UsersPage";
import UserDetailPage from "../pages/private/Users/UserDetailPage";
import RolesPage from "../pages/private/Roles/RolesPage";
import RoleEditPage from "../pages/private/Roles/RoleEditPage";
import Dashboard from "../pages/private/Dashboard/Dashboard";

export const routes = [
  {
    name: "Dashboard", // Se dejará un dashboard de ejemplo
    icon: MdHome,
    path: "/dashboard",
    component: Dashboard, // Usamos ItemsPage como página principal por ahora
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["DEMO", "Enfermera", "Viewer"], // Se gestionará por roles genéricos
  },
  {
    name: "Items",
    icon: MdList,
    path: "/items",
    component: ItemsPage,
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["DEMO", "Enfermera", "Viewer"],  // Se gestionará por roles genéricos
  },
  {
    name: "Detalle del Item",
    path: "/items/:itemId", // Ruta dinámica
    component: ItemDetailPage,
    isPrivate: true,
    showSidebar: false, // Importante: no la mostramos en el menú lateral
    accessValidate: ["DEMO", "Enfermera", "Viewer"],
  },
  {
    name: "Usuarios",
    icon: MdPeople,
    path: "/users",
    component: UsersPage,
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["Superuser"], // Solo el superusuario puede ver esto
  },
  {
    name: "Detalle del Usuario",
    path: "/users/:userId", // Ruta dinámica
    component: UserDetailPage,
    isPrivate: true,
    showSidebar: false, // Importante: no la mostramos en el menú lateral
    accessValidate: ["Superuser"],
  },
  {
    name: "Roles",
    icon: MdPeople,
    path: "/roles",
    component: RolesPage,
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["Superuser"], // Solo el superusuario puede ver esto
  },
  {
    name: "Detalle del Rol",
    path: "/roles/:roleId", // Ruta dinámica
    component: RoleEditPage,
    isPrivate: true,
    showSidebar: false, // Importante: no la mostramos en el menú lateral
    accessValidate: ["Superuser"],
  },
  {
    // Ruta de login pública
    path: "/login",
    component: LoginPage,
    isPrivate: false,
    showSidebar: false,
    accessValidate: false,
  },
];
