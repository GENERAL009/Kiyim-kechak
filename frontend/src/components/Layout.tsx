import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Shirt,
  Warehouse,
  Boxes,
  ShoppingCart,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  Shield
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

export const Layout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'SELLER']
    },
    {
      name: 'Mahsulotlar',
      path: '/products',
      icon: Shirt,
      roles: ['ADMIN', 'WAREHOUSE_MANAGER']
    },
    {
      name: 'Omborlar',
      path: '/warehouses',
      icon: Warehouse,
      roles: ['ADMIN', 'WAREHOUSE_MANAGER']
    },
    {
      name: 'Inventar',
      path: '/inventory',
      icon: Boxes,
      roles: ['ADMIN', 'WAREHOUSE_MANAGER']
    },
    {
      name: 'Sotuv & Buyurtma',
      path: '/sales',
      icon: ShoppingCart,
      roles: ['ADMIN', 'SELLER']
    },
    {
      name: 'Hisobotlar',
      path: '/reports',
      icon: BarChart3,
      roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'SELLER']
    }
  ];

  const filteredItems = sidebarItems.filter(item => hasRole(item.roles));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'bg-rose-500 text-white';
      case 'WAREHOUSE_MANAGER':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0">
        {/* Brand Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            W
          </div>
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CLOTHING WMS
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {filteredItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate text-slate-200">{user?.full_name}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-0.5 ${getRoleBadgeColor(user?.role?.name)}`}>
                {user?.role?.name}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors duration-150 border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            Tizimdan chiqish
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Sidebar on mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          
          <aside className="relative flex flex-col w-64 max-w-[80vw] bg-slate-900 text-slate-100 h-full border-r border-slate-800">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white">
                W
              </div>
              <span className="font-bold text-lg tracking-wider">CLOTHING WMS</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {filteredItems.map(item => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">{user?.full_name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-0.5 ${getRoleBadgeColor(user?.role?.name)}`}>
                    {user?.role?.name}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                Tizimdan chiqish
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">
              {location.pathname === '/' ? 'Bosh sahifa' : location.pathname.substring(1).replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-slate-200 dark:border-slate-800"
              title="Mavzuni almashtirish"
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </button>

            {/* Quick action button or date */}
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bugungi sana</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
