import React, { useState, useEffect } from 'react';
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaCamera,
    FaCheck,
    FaTimes,
    FaBell,
    FaMoon,
    FaSun,
    FaGlobe,
    FaLanguage,
    FaPalette,
    FaShieldAlt,
    FaSignOutAlt,
    FaTrash,
    FaBackward,
    FaChevronLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: '',
        email: '',
        avatar: '',
        bio: '',
        location: '',
        website: '',
        language: 'en',
        theme: 'light',
        notifications: true,
        twoFactor: false
    });
    const [editMode, setEditMode] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('myspace_token');
            if (!token) return navigate('/login');

            try {
                const res = await axios.get('/api/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser({
                    ...res.data.user,
                    avatar: res.data.user.avatar
                        ? `https://myspace-e81p.onrender.com${res.data.user.avatar}`
                        : 'https://i.postimg.cc/cH2Q2ZNs/IMG-1170.png'
                });
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching user data:', err);
                toast.error('Failed to load profile data');
                navigate('/login');
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUser({
            ...user,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const token = localStorage.getItem('myspace_token');
            const formData = new FormData();

            if (avatarPreview) {
                const blob = await fetch(avatarPreview).then(r => r.blob());
                formData.append('avatar', blob, 'avatar.jpg');
            }

            formData.append('name', user.name);
            formData.append('bio', user.bio);
            formData.append('location', user.location);
            formData.append('website', user.website);

            const res = await axios.put('/api/profile', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Normalize avatar URL like in fetchUserData
            const updatedUser = {
                ...res.data.user,
                avatar: res.data.user.avatar
                    ? `http://localhost:5000${res.data.user.avatar}`
                    : 'https://i.postimg.cc/cH2Q2ZNs/IMG-1170.png'
            };

            setUser(updatedUser);
            setEditMode(false);
            setAvatarPreview('');
            toast.success('Profile updated successfully');
        } catch (err) {
            console.error('Error updating profile:', err);
            toast.error('Failed to update profile');
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            const token = localStorage.getItem('myspace_token');
            await axios.put('/api/profile/password', {
                currentPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Password changed successfully');
        } catch (err) {
            console.error('Error changing password:', err);
            toast.error(err.response?.data?.error || 'Failed to change password');
        }
    };

    const handleThemeChange = async (theme) => {
        try {
            const token = localStorage.getItem('myspace_token');
            await axios.put('/api/profile/theme', { theme }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser({ ...user, theme });
            toast.success('Theme updated successfully');
        } catch (err) {
            console.error('Error changing theme:', err);
            toast.error('Failed to update theme');
        }
    };

    const handleDeleteAccount = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }

        try {
            const token = localStorage.getItem('myspace_token');
            await axios.delete('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            localStorage.removeItem('myspace_token');
            toast.success('Account deleted successfully');
            navigate('/login');
        } catch (err) {
            console.error('Error deleting account:', err);
            toast.error('Failed to delete account');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('myspace_token');
        navigate('/login');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div
                        className="flex items-center w-full gap-x-4 justify-between flex-nowrap min-w-0"
                        style={{ minHeight: '3.5rem' }}
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Go back"
                            >
                                <FaChevronLeft className="text-lg" />
                            </button>
                            <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap truncate min-w-0">Profile Settings</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                            {editMode ? (
                                <>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm"
                                    >
                                        <FaCheck className="mr-2" /> Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditMode(false);
                                            setAvatarPreview('');
                                        }}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center shadow-sm"
                                    >
                                        <FaTimes className="mr-2" /> Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm"
                                >
                                    <FaUser className="mr-2" /> Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-64 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative mb-4">
                                <img
                                    src={avatarPreview || user.avatar}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-gray-700 shadow"
                                />
                                {editMode && (
                                    <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg border-2 border-white dark:border-gray-800">
                                        <FaCamera />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                )}
                            </div>
                            <h2 className="text-xl font-semibold text-center">{user.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">{user.email}</p>
                        </div>

                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${activeTab === 'profile' ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <FaUser className="mr-3" /> Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${activeTab === 'security' ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <FaLock className="mr-3" /> Security
                            </button>
                            {/* Preferences and Notifications removed */}
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 rounded-lg flex items-center hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                            >
                                <FaSignOutAlt className="mr-3" /> Logout
                            </button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
                                <form className="space-y-6 max-w-xl mx-auto">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={user.name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            disabled={!editMode}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Bio</label>
                                        <textarea
                                            name="bio"
                                            value={user.bio}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            disabled={!editMode}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={user.location}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            disabled={!editMode}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Website</label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={user.website}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            disabled={!editMode}
                                        />
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Change Password</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">New Password</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                            <button
                                                onClick={handlePasswordChange}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                            >
                                                Change Password
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Status: {user.twoFactor ? 'Enabled' : 'Disabled'}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {user.twoFactor
                                                        ? 'Extra layer of security for your account'
                                                        : 'Add extra security to your account'}
                                                </p>
                                            </div>
                                            <button
                                                className={`px-4 py-2 rounded-lg ${user.twoFactor ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700'}`}
                                            >
                                                {user.twoFactor ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <h3 className="text-lg font-medium mb-4 text-red-600 dark:text-red-400">Danger Zone</h3>
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                <div className="mb-4 sm:mb-0">
                                                    <p className="font-medium">Delete Account</p>
                                                    <p className="text-sm text-red-600 dark:text-red-400">
                                                        Once deleted, your account cannot be recovered
                                                    </p>
                                                </div>
                                                {deleteConfirm ? (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={handleDeleteAccount}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                                                        >
                                                            <FaCheck className="mr-2" /> Confirm Delete
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(false)}
                                                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(true)}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                                                    >
                                                        <FaTrash className="mr-2" /> Delete Account
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Preferences and Notifications sections removed */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;