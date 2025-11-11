// icons
import { MdHome, MdList, MdPeople, MdBusiness, MdHistory } from "react-icons/md";
import { FiUsers } from "react-icons/fi";

// pages
import LoginPage from "../pages/public/LoginScreen/LoginPage";
import ItemsPage from "../pages/private/Items/ItemsPage";
import ItemDetailPage from "../pages/private/Items/ItemDetailPage";
import ClientsPage from "../pages/private/Clients/ClientsPage";
import ClientDetailPage from "../pages/private/Clients/ClientDetailPage";
import ClientCreatePage from "../pages/private/Clients/ClientCreatePage";
import ClientEditPage from "../pages/private/Clients/ClientEditPage";
import UsersPage from "../pages/private/Users/UsersPage";
import UserDetailPage from "../pages/private/Users/UserDetailPage";
import RolesPage from "../pages/private/Roles/RolesPage";
import RoleEditPage from "../pages/private/Roles/RoleEditPage";
import DistributorTabsPage from "../pages/private/Distributors/DistributorTabsPage";
// import DistributorsPage from "../pages/private/Distributors/DistributorsPage";
import DistributorDetailPage from "../pages/private/Distributors/DistributorDetailPage";
import DistributorEditPage from "../pages/private/Distributors/DistributorEditPage";
import DistributorRegistration from "../pages/public/DistributorRegistration/DistributorRegistration";
import DistributorValidatePage from "../pages/private/Distributors/Validate/DistributorValidatePage";
import AuditlogsPage from "../pages/private/Auditlogs/AuditlogsPage";
import Dashboard from "../pages/private/Dashboard/Dashboard";


export const routes = [
  {
    name: "Dashboard", // Se dejará un dashboard de ejemplo
    icon: MdHome,
    path: "/dashboard",
    component: Dashboard, // Usamos ItemsPage como página principal por ahora
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["Administrador", "Editor", "Backoffice"], // Se gestionará por roles genéricos
  },
  {
    name: "Items",
    icon: MdList,
    path: "/items",
    component: ItemsPage,
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["Administrador", "Editor", "Backoffice"],  // Se gestionará por roles genéricos
  },
  {
    name: "Detalle del Item",
    path: "/items/:itemId", // Ruta dinámica
    component: ItemDetailPage,
    isPrivate: true,
    showSidebar: false, // Importante: no la mostramos en el menú lateral
    accessValidate: ["Administrador", "Editor", "Backoffice"],
  },
  {
    name: "Clientes",
    icon: FiUsers,
    path: "/clients",
    component: ClientsPage,
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["Administrador", "Backoffice"], // Se gestionará por roles genéricos
  },
  {
    name: "Detalle del Cliente",
    path: "/clients/:clientId", // Ruta dinámica
    component: ClientDetailPage,
    isPrivate: true,
    showSidebar: false, // Importante: no la mostramos en el menú lateral
    accessValidate: ["Administrador", "Backoffice"],
  },
  {
    name: "Crear Cliente",
    path: "/clients/create",
    component: ClientCreatePage,
    isPrivate: true,
    showSidebar: false, // No mostrar en sidebar
    accessValidate: ["Administrador", "Backoffice"],
  },
  {
    name: "Editar Cliente",
    path: "/clients/edit/:clientId",
    component: ClientEditPage,
    isPrivate: true,
    showSidebar: false, // No mostrar en sidebar
    accessValidate: ["Administrador", "Backoffice"],
  },
  {
    name: "Distribuidores",
    icon: MdBusiness,
    path: "/distributors",
    component: DistributorTabsPage,
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["Backoffice"],  // Se gestionará por roles genéricos
  },
  {
    name: "Detalle del Distribuidor",
    path: "/distributors/:distributorId", // Ruta dinámica
    component: DistributorDetailPage,
    isPrivate: true,
    showSidebar: false, // Importante: no la mostramos en el menú lateral
    accessValidate: ["Backoffice"],
  },
  {
    name: "Crear Distribuidor",
    path: "/distributors/create",
    component: DistributorRegistration,
    isPrivate: false,
    showSidebar: false,
    accessValidate: false,
  },
  {
    name: "Editar Distribuidor",
    path: "/distributors/edit/:distributorId",
    component: DistributorEditPage,
    isPrivate: true,
    showSidebar: false, // Importante: no la mostramos en el menú lateral
    accessValidate: ["Backoffice"],
  },
  {
    name: "Validar Distribuidor",
    path: "/distributors/validate/:distributorId",
    component: DistributorValidatePage,
    isPrivate: true,
    showSidebar: false, // Importante: no la mostramos en el menú lateral
    accessValidate: ["Backoffice"],
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
    // Ruta de bitácora de auditoría (auditlog)
    name: "Auditoría",
    icon: MdHistory,
    path: "/auditlogs",
    component: AuditlogsPage,
    isPrivate: true,
    showSidebar: true,
    accessValidate: ["Superuser","Admin","Backoffice"],
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
