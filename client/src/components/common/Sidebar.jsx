import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FiHome,
    FiPackage,
    FiShoppingCart,
    FiTrendingUp,
    FiList,
    FiLogOut,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/', icon: FiHome, label: 'Dashboard' },
        { path: '/categories', icon: FiList, label: 'Categories' },
        { path: '/products', icon: FiPackage, label: 'Products' },
        { path: '/purchases', icon: FiShoppingCart, label: 'Purchases' },
        { path: '/sales', icon: FiTrendingUp, label: 'Sales' },
    ];

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div
            className={`bg-gray-900 text-white h-full py-7 px-2 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            <div className="flex items-center justify-between mb-8 px-2">
                {!collapsed && <h1 className="text-2xl font-bold">EuhoriaNepal</h1>}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                >
                    {collapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            <nav>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-700 text-gray-300'
                                } ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? item.label : ''}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span className="font-[Hind]">{item.label}</span>}
                        </Link>
                    );
                })}
                <button
                    onClick={handleLogout}
                    className={`flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 text-gray-300 w-full mt-8 ${collapsed ? 'justify-center' : ''
                        }`}
                    title={collapsed ? 'Logout' : ''}
                >
                    <FiLogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="font-[Hind]">Logout</span>}
                </button>
            </nav>
            <div>
                {collapsed ?
                    "" :
                    (
                        <p className="flex items-center justify-center text-xs text-gray-500 mt-8 px-4 font-[Montserrat]">
                            &copy; {new Date().getFullYear()} Ushal Bindukar
                        </p>
                    )}
            </div>
        </div>
    );
}
export default Sidebar;