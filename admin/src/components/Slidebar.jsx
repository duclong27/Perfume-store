// // /src/components/Sidebar.jsx
// import { NavLink, Link, useNavigate } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   BarChart3,
//   Package,
//   ShoppingCart,
//   Shield,
//   LogOut,
//   ListTree,
// } from "lucide-react";

// export default function Sidebar() {
//   const navigate = useNavigate();

//   const itemClass = ({ isActive }) =>
//     `flex items-center gap-3 rounded-xl transition
//      hover:bg-white/10 hover:text-white
//      ${isActive ? "bg-white/15 text-white" : "text-slate-300"}
//      px-4 py-2 lg:py-3
//      text-base lg:text-lg`;

//   const handleLogout = () => {
//     const tokenKeys = ["accessToken", "refreshToken", "jwt", "auth_token", "token", "user", "auth_user"];
//     tokenKeys.forEach((k) => {
//       try { localStorage.removeItem(k); } catch {}
//       try { sessionStorage.removeItem(k); } catch {}
//     });
//     navigate("/login", { replace: true });
//   };

//   return (
//     <aside
//       className="
//         fixed left-6 top-6 bottom-6
//         w-64 lg:w-72
//         rounded-2xl border border-white/10
//         bg-gradient-to-b from-[#1b0f3a] via-[#1a154a] to-[#211a63]
//         shadow-2xl shadow-black/40 backdrop-blur-sm
//         flex flex-col
//         overflow-hidden
//       "
//     >
//       {/* Logo */}
//       <div className="flex items-center gap-3 px-6 py-6 shrink-0">
//         <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
//           <Shield className="h-8 w-8 text-fuchsia-400" />
//           <span className="tracking-wide">Admin Panel</span>
//         </Link>
//       </div>

//       <div className="mx-4 h-px bg-white/10 shrink-0" />

//       {/* Navigation (scroll được khi màn hình thấp) */}
//       <nav
//         className="
//           flex-1
//           overflow-y-auto
//           px-2
//           py-4
//           flex flex-col
//           gap-2 lg:gap-3
//         "
//       >
//         <NavLink to="admin/dashboard" className={itemClass}>
//           <LayoutDashboard className="h-6 w-6" />
//           <span>Dashboard</span>
//         </NavLink>

//         <NavLink to="admin/account" className={itemClass}>
//           <Users className="h-6 w-6" />
//           <span>Account</span>
//         </NavLink>

//         <NavLink to="admin/category" className={itemClass}>
//           <BarChart3 className="h-6 w-6" />
//           <span>Category</span>
//         </NavLink>

//         <NavLink to="admin/product" className={itemClass}>
//           <Package className="h-5 w-5" />
//           <span>Product</span>
//         </NavLink>

//         <NavLink to="admin/order" className={itemClass}>
//           <ShoppingCart className="h-5 w-5" />
//           <span>Order</span>
//         </NavLink>

//         <NavLink to="admin/variantProduct" className={itemClass}>
//           <ListTree className="h-5 w-5" />
//           <span>Variant</span>
//         </NavLink>
//       </nav>

//       {/* Bottom logout (không absolute nữa -> không đè) */}
//       <div className="px-4 pb-4 pt-2 shrink-0 border-t border-white/10 bg-black/0">
//         <button
//           onClick={handleLogout}
//           className="
//             w-full flex items-center gap-3 px-4 py-3 rounded-xl
//             bg-white/10 text-slate-300
//             hover:bg-red-500/20 hover:text-red-400 transition
//           "
//         >
//           <LogOut className="h-5 w-5" />
//           <span>Log Out</span>
//         </button>
//       </div>
//     </aside>
//   );
// }


// /src/components/Sidebar.jsx
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Package,
  ShoppingCart,
  Shield,
  LogOut,
  ListTree,
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();

  const itemClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl transition
     hover:bg-white/10 hover:text-white
     ${isActive ? "bg-white/15 text-white" : "text-slate-300"}
     px-4 py-2 lg:py-3
     text-base lg:text-lg`;

  const handleLogout = () => {
    const tokenKeys = ["accessToken", "refreshToken", "jwt", "auth_token", "token", "user", "auth_user"];
    tokenKeys.forEach((k) => {
      try { localStorage.removeItem(k); } catch { }
      try { sessionStorage.removeItem(k); } catch { }
    });
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className="
        fixed left-6 top-6 bottom-6
        w-64 lg:w-72
        rounded-2xl border border-white/10
        bg-gradient-to-b from-[#1b0f3a] via-[#1a154a] to-[#211a63]
        shadow-2xl shadow-black/40 backdrop-blur-sm
        flex flex-col
        overflow-hidden
      "
    >
      
      <div className="flex items-center gap-3 px-6 py-6 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <Shield className="h-8 w-8 text-fuchsia-400" />
          <span className="tracking-wide">Admin Panel</span>
        </Link>
      </div>

      <div className="mx-4 h-px bg-white/10 shrink-0" />

      
      <nav
        className="
          flex-1
          overflow-y-auto
          px-2
          py-4
          flex flex-col
          gap-2 lg:gap-3
        "
      >
        <NavLink to="admin/dashboard" className={itemClass}>
          <LayoutDashboard className="h-6 w-6" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="admin/account" className={itemClass}>
          <Users className="h-6 w-6" />
          <span>Account</span>
        </NavLink>

        <NavLink to="admin/category" className={itemClass}>
          <BarChart3 className="h-6 w-6" />
          <span>Category</span>
        </NavLink>

        <NavLink to="admin/product" className={itemClass}>
          <Package className="h-5 w-5" />
          <span>Product</span>
        </NavLink>

        <NavLink to="admin/order" className={itemClass}>
          <ShoppingCart className="h-5 w-5" />
          <span>Order</span>
        </NavLink>

        <NavLink to="admin/variantProduct" className={itemClass}>
          <ListTree className="h-5 w-5" />
          <span>Variant</span>
        </NavLink>
      </nav>


      <div className="px-4 pb-4 pt-2 shrink-0 border-t border-white/10 bg-black/0">
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3 px-4 py-3 rounded-xl
            bg-white/10 text-slate-300
            hover:bg-red-500/20 hover:text-red-400 transition
          "
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}

