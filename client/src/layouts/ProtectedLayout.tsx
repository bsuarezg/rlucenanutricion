import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const SidebarItem: React.FC<{ to: string; Icon: LucideIcon; label: string }> = ({ to, Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link to={to} className={clsx(
            "flex items-center px-4 py-3 mb-1 text-sm font-medium transition-colors rounded-lg",
            isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}>
            <Icon size={20} className={clsx("mr-3", isActive ? "text-primary-600" : "text-gray-400")} />
            {label}
        </Link>
    );
}

const ProtectedLayout: React.FC = () => {
    const { token, logout, user } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center">
                        <span className="w-8 h-8 bg-primary-600 rounded-lg mr-2 flex items-center justify-center text-white font-bold text-lg">N</span>
                        NutriApp
                    </h1>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <SidebarItem to="/" Icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/patients" Icon={Users} label="Pacientes" />
                    <SidebarItem to="/sessions" Icon={FileText} label="Sesiones" />
                    <SidebarItem to="/templates" Icon={Settings} label="Plantillas" />
                    <SidebarItem to="/zones" Icon={Settings} label="Zonas Corporales" />
                    <SidebarItem to="/settings" Icon={Settings} label="Configuración" />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center mb-4 px-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold mr-3">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-700">{user?.username}</div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={18} className="mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default ProtectedLayout;
