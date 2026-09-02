import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiBell,
  FiLogOut,
  FiMenu,
  FiKey,
  FiUserPlus,
  FiSettings,
  FiChevronDown
} from 'react-icons/fi';
import { logout } from '../../features/auth/authSlice';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import RegisterUserModal from '../auth/RegisterUserModal';

const Header = ({ toggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRegisterUser, setShowRegisterUser] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="md:hidden mr-4 text-gray-600 hover:text-gray-800"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 font-[Montserrat]">
            Welcome, <span className="font-[Italianno] uppercase">{user?.username || 'User'}</span>
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="text-gray-500 hover:text-gray-700 relative">
            <FiBell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {user?.role || 'User'}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {/* Change Password */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowChangePassword(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <FiKey className="w-4 h-4 text-gray-500" />
                    <span>Change Password</span>
                  </button>

                  {/* Register New User - Admin only */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setShowRegisterUser(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FiUserPlus className="w-4 h-4 text-green-500" />
                      <span>Register New User</span>
                    </button>
                  )}

                  {/* Settings (Optional) */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      // Navigate to settings page or show settings modal
                      toast.info('Settings feature coming soon');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <FiSettings className="w-4 h-4 text-gray-500" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-1"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <RegisterUserModal
        isOpen={showRegisterUser}
        onClose={() => setShowRegisterUser(false)}
        onSuccess={() => {
          setShowRegisterUser(false);
          toast.success('User registered successfully!');
        }}
      />
    </>
  );
};

export default Header;