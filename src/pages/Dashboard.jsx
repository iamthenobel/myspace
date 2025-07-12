import React, { useState, useEffect } from 'react';
import LeftNav from './LeftNav';
import DashboardContent from './DashboardContent';
import RightNav from './RightNav';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from './ThemeContext';

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLeftNavCollapsed, setIsLeftNavCollapsed] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        const root = window.document.documentElement;
        theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    }, [theme]);
    const toggleLeftNavCollapse = () => {
        setIsLeftNavCollapsed(!isLeftNavCollapsed);
    };
    return (
        <div
            className="h-screen w-full flex bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
        >
            {/* Transparent Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />)}

            {/* LeftNav - Desktop */}
            <div
                className={`z-60 hidden md:flex flex-col overflow-y-auto h-full transition-all duration-300 ${isLeftNavCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                <LeftNav
                    isCollapsed={isLeftNavCollapsed}
                    toggleCollapse={toggleLeftNavCollapse}
                /></div>

            {/* LeftNav - Mobile Animated */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-[300px]'
                    }`}
            >
                <LeftNav setSidebarOpen={setSidebarOpen} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                    <DashboardContent setSidebarOpen={setSidebarOpen} />
                </div>
            </div>
            {/* RightNav - Only on large screens */}
            <div className="hidden lg:flex flex-col w-76 overflow-y-auto border-l border-l-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <RightNav isOpen={true} toggleRightNav={() => { }} />
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} />
            
        </div>
    );
};

export default Dashboard;