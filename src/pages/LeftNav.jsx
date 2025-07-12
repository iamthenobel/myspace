import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaFolder, FaFolderPlus, FaUser, FaCog,
  FaSignOutAlt, FaChevronDown, FaChevronRight,
  FaFile, FaUsers, FaChartLine, FaShareAlt,
  FaStar, FaHistory, FaTrash, FaCloud,
  FaSpaceShuttle, FaBell, FaBars
} from 'react-icons/fa';
import { TbLayoutSidebarRightCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb';
import { useTheme } from './ThemeContext';

const LeftNav = ({ isCollapsed, toggleCollapse, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState([]);
  const [user, setUser] = useState({
    name: "Loading...",
    email: "",
    avatar: "",
    role: "Member"
  });
  const [notificationCount, setNotificationCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [storage, setStorage] = useState({
    used: 0,
    max: 2 * 1024 * 1024 * 1024 // Default 2GB
  });

  const useIsSmallScreen = (breakpoint = 1024) => {
    const [isSmall, setIsSmall] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
      const handleResize = () => setIsSmall(window.innerWidth < breakpoint);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isSmall;
  };

  const isSmallScreen = useIsSmallScreen();

  const fetchUser = async () => {
    const token = localStorage.getItem('myspace_token');
    if (!token) return navigate('/login');

    try {
      const res = await axios.get('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({
        name: res.data.user.name || "User",
        email: res.data.user.email || "",
        avatar: res.data.user.avatar ? `https://myspace-e81p.onrender.com${res.data.user.avatar}` : "",
      });
    } catch (err) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const fetchCounts = async () => {
    const token = localStorage.getItem('myspace_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [notifRes, trashRes] = await Promise.all([
        axios.get('/api/notifications/unreadCount', { headers }),
        axios.get('/api/trash/count', { headers })
      ]);

      setNotificationCount(notifRes.data.count || 0);
      setTrashCount(trashRes.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch counts:", err);
    }
  };

  const fetchStorageUsage = async () => {
    const token = localStorage.getItem('myspace_token');
    try {
      const [usageRes, limitsRes] = await Promise.all([
        axios.get('/api/storage/usage', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/storage/limits', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStorage({
        used: usageRes.data.storage_used || 0,
        max: limitsRes.data.max_storage || (2 * 1024 * 1024 * 1024)
      });
    } catch (err) {
      console.error("Failed to fetch storage data:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchCounts();
    fetchStorageUsage();

    // Refresh storage data every 5 minutes
    const interval = setInterval(fetchStorageUsage, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatStorage = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const menuItems = [
    {
      id: 'workspace',
      category: 'My Workspace',
      items: [
        { name: 'Dashboard', icon: <FaFolder />, path: '/dashboard' },
        isSmallScreen && {
          name: 'Notifications',
          icon: <FaBell />,
          path: '/notifications',
          showBadge: true,
          badgeCount: notificationCount,
          responsiveOnly: true,
        },
        {
          name: 'Trash',
          icon: <FaTrash />,
          path: '/trash',
          showBadge: true,
          badgeCount: trashCount,
        },
      ].filter(Boolean),
    },
    {
      id: 'account',
      category: "Account",
      items: [
        { name: "Profile Settings", icon: <FaUser />, path: "/profile" },
        {
          name: "Logout",
          icon: <FaSignOutAlt />,
          path: "/logout",
          action: () => {
            localStorage.clear();
            navigate('/login');
          }
        }
      ]
    }
  ];

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuExpanded = (menuId) => expandedMenus.includes(menuId);

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col fixed top-0 h-full z-50 md:relative md:z-0 transition-all duration-200`}
    >
      {/* App Name & Collapse Button */}
      <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FaSpaceShuttle /> MySpace
          </h1>
        )}
        {isCollapsed && (
          <FaSpaceShuttle className="text-indigo-600 dark:text-indigo-400 text-xl" />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCollapse}
            className="hidden md:block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <TbLayoutSidebarLeftExpand className="w-5 h-5" />
            ) : (
              <TbLayoutSidebarRightCollapse className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      <div
        className={`p-4 border-b border-gray-200 dark:border-gray-700 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
        onClick={() => navigate('/profile')}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt="User"
            className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900`}
          />
        ) : (
          <div className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center`}>
            <FaUser className="text-indigo-600 dark:text-indigo-300" />
          </div>
        )}
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        )}
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto py-2 custom-scroll">
        <nav className="px-2">
          {menuItems.map((section) => (
            <div key={section.id} className="mb-4">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                  {section.category}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.name}>
                    {item.subItems ? (
                      <div className="relative">
                        <div
                          className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-2 px-3'} rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors`}
                          onClick={() => toggleMenu(section.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-500 dark:text-indigo-400 text-sm">{item.icon}</span>
                            {!isCollapsed && <span className="text-sm">{item.name}</span>}
                          </div>
                          {!isCollapsed && (
                            isMenuExpanded(section.id) ? (
                              <FaChevronDown className="text-xs text-gray-400 dark:text-gray-500" />
                            ) : (
                              <FaChevronRight className="text-xs text-gray-400 dark:text-gray-500" />
                            )
                          )}
                        </div>
                        {!isCollapsed && (
                          <AnimatePresence>
                            {isMenuExpanded(section.id) && (
                              <motion.ul
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="pl-8 overflow-hidden"
                              >
                                {item.subItems.map((subItem) => (
                                  <li
                                    key={subItem.name}
                                    className="p-2 text-xs rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    onClick={() => navigate(subItem.path)}
                                  >
                                    {subItem.name}
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`relative flex items-center ${isCollapsed ? 'justify-center p-2' : 'p-2 px-3'} rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors`}
                        onClick={item.action || (() => navigate(item.path))}
                        title={isCollapsed ? item.name : ''}
                      >
                        <span className={`${isCollapsed
                          ? 'text-gray-600 dark:text-gray-50 text-xl'
                          : 'text-indigo-500 dark:text-indigo-400 text-sm'
                          } relative`}>
                          {item.icon}

                          {item.showBadge && item.badgeCount > 0 && (
                            <span className="absolute top-1 right-2 bg-red-400 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
                              {item.badgeCount > 99 ? '99+' : item.badgeCount}
                            </span>
                          )}
                        </span>
                        {!isCollapsed && <span className="text-sm ml-2">{item.name}</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Storage Indicator */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Storage</span>
            <span>
              {((storage.used / storage.max) * 100).toFixed(1)}% used ({formatStorage(storage.used)} of {formatStorage(storage.max)})
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full"
              style={{ width: `${Math.min((storage.used / storage.max) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default LeftNav;