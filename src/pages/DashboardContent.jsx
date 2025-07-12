import React, { useState, useEffect, useRef } from 'react';
import {
  FaFolderPlus,
  FaEdit,
  FaSearch,
  FaStickyNote,
  FaImage,
  FaVideo,
  FaMusic,
  FaFileAlt,
  FaEllipsisV,
  FaTimes,
  FaTrash,
  FaDownload,
  FaFolder,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileArchive,
  FaFileCode,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from './ThemeContext';

// Simple Modal Component (can be replaced with a more robust one if you have it)
const RenameModal = ({ isOpen, onClose, onRename, currentName }) => {
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    setNewName(currentName); // Reset name when modal opens for a new folder
  }, [currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() === '') {
      toast.error('Folder name cannot be empty');
      return;
    }
    onRename(newName);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 max-w-md relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <FaTimes className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Rename Folder
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="newFolderName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              New Folder Name
            </label>
            <input
              type="text"
              id="newFolderName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:bg-gray-700 dark:text-gray-100"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={newName.trim() === ''}
            >
              Rename
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DashboardContent = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const [spaceName, setSpaceName] = useState('MySpace');
  const [isEditing, setIsEditing] = useState(false);
  const [lastSavedName, setLastSavedName] = useState('MySpace');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: '', type: 'note' });
  const [folders, setFolders] = useState([]);
  const [hoveredFolder, setHoveredFolder] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const menuRefs = useRef({});
  const { theme } = useTheme(); // Use the theme context

  // New state for rename modal
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState(null);

  // File type icons mapping
  const fileIcons = {
    note: <FaStickyNote className="text-yellow-500" />,
    image: <FaImage className="text-blue-500" />,
    video: <FaVideo className="text-red-500" />,
    audio: <FaMusic className="text-purple-500" />,
    'application/pdf': <FaFilePdf className="text-red-500" />,
    'application/msword': <FaFileWord className="text-blue-600" />,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (
      <FaFileWord className="text-blue-600" />
    ),
    'application/vnd.ms-excel': <FaFileExcel className="text-green-600" />,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': (
      <FaFileExcel className="text-green-600" />
    ),
    'application/vnd.ms-powerpoint': (
      <FaFilePowerpoint className="text-orange-600" />
    ),
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': (
      <FaFilePowerpoint className="text-orange-600" />
    ),
    'application/zip': <FaFileArchive className="text-yellow-600" />,
    'application/x-rar-compressed': <FaFileArchive className="text-yellow-600" />,
    'application/x-7z-compressed': <FaFileArchive className="text-yellow-600" />,
    'text/html': <FaFileCode className="text-pink-500" />,
    'text/css': <FaFileCode className="text-blue-500" />,
    'text/javascript': <FaFileCode className="text-yellow-500" />,
    default: <FaFileAlt className="text-gray-500" />,
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.values(menuRefs.current).forEach((ref) => {
        if (ref && !ref.contains(event.target)) {
          setShowActionsMenu(null);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // In your DashboardContent component, modify the useEffect hook:
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('myspace_token');
      if (!token) return navigate('/login');

      try {
        // Fetch user data and space name in parallel
        const [userRes, spaceRes] = await Promise.all([
          axios.get('/api/me', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/space/name', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUser(userRes.data.user);
        setSpaceName(spaceRes.data.space_name);
        setLastSavedName(spaceRes.data.space_name);
        fetchFolders(token);
      } catch (err) {
        localStorage.clear();
        navigate('/login');
      }
    };

    const fetchFolders = async (token) => {
      try {
        const res = await axios.get('/api/folders', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const foldersWithCounts = await Promise.all(
          res.data.map(async (folder) => {
            const filesRes = await axios.get(
              `/api/files/${folder.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            return {
              ...folder,
              fileCount: Array.isArray(filesRes.data) ? filesRes.data.length : 0,
            };
          })
        );

        setFolders(foldersWithCounts);
      } catch (err) {
        console.error('Fetch folders error:', err);
        toast.error('Failed to load folders');
      }
    };

    fetchUser();
  }, [navigate]);

  const handleNameEdit = async (e) => {
    e.preventDefault();

    if (!spaceName.trim()) {
      toast.error('Space name cannot be empty');
      return;
    }

    try {
      const token = localStorage.getItem('myspace_token');

      const res = await axios.put(
        '/api/space/name',
        { space_name: spaceName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLastSavedName(res.data.space_name);
      setIsEditing(false);
      toast.success('Space name updated');
    } catch (err) {
      toast.error(
        err?.response?.data?.details || 'Failed to update space name'
      );
      console.error('Update error:', err);
      // Revert to last saved name on error
      setSpaceName(lastSavedName);
    }
  };

  const handleFolderCreate = async (e) => {
    e.preventDefault();
    console.log('Attempting to create folder...');
    const token = localStorage.getItem('myspace_token');
    try {
      const res = await axios.post(
        '/api/folders',
        folderForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFolders((prev) => [...prev, { ...res.data, fileCount: 0 }]);
      setFolderForm({ name: '', type: 'note' });
      setShowFolderForm(false);
      toast.success('Folder created successfully');
      console.log('Folder created successfully:', res.data);
    } catch (err) {
      console.error('Create folder error:', err);
      toast.error(err.response?.data?.error || 'Failed to create folder');
    }
  };

  const handleRenameFolder = async (folderId, newName) => {
    const token = localStorage.getItem('myspace_token');
    try {
      await axios.put(
        `/api/folders/${folderId}`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
      );
      toast.success('Folder renamed successfully');
    } catch (err) {
      console.error('Rename folder error:', err);
      toast.error('Failed to rename folder');
    } finally {
      setIsRenameModalOpen(false);
      setFolderToRename(null);
      setShowActionsMenu(null); // Close actions menu after action
    }
  };

  const handleFolderAction = async (folder, action) => {
    const token = localStorage.getItem('myspace_token');
    try {
      switch (action) {
        case 'delete':
          await axios.delete(`/api/folders/${folder.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFolders((prev) => prev.filter((f) => f.id !== folder.id));
          toast.success('Folder deleted successfully');
          break;

        case 'rename':
          setFolderToRename(folder);
          setIsRenameModalOpen(true);
          break;

        case 'download':
          toast.info('Folder download feature coming soon');
          break;

        default:
          break;
      }
      setShowActionsMenu(null); // Close menu regardless of action
    } catch (err) {
      console.error('Folder action error:', err);
      toast.error(`Failed to ${action} folder`);
    }
  };

  const fileCategories = [
    {
      name: 'Notes',
      icon: <FaStickyNote className="text-yellow-600" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-800',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      textColor: 'text-yellow-800 dark:text-yellow-100',
      type: 'note',
      route: '/folders?type=note',
    },
    {
      name: 'Images',
      icon: <FaImage className="text-sky-600" />,
      bgColor: 'bg-sky-100 dark:bg-sky-800',
      borderColor: 'border-sky-200 dark:border-sky-700',
      textColor: 'text-sky-800 dark:text-sky-100',
      type: 'image',
      route: '/folders?type=image',
    },
    {
      name: 'Videos',
      icon: <FaVideo className="text-rose-600" />,
      bgColor: 'bg-rose-100 dark:bg-rose-800',
      borderColor: 'border-rose-200 dark:border-rose-700',
      textColor: 'text-rose-800 dark:text-rose-100',
      type: 'video',
      route: '/folders?type=video',
    },
    {
      name: 'Audio',
      icon: <FaMusic className="text-indigo-600" />,
      bgColor: 'bg-indigo-100 dark:bg-indigo-800',
      borderColor: 'border-indigo-200 dark:border-indigo-700',
      textColor: 'text-indigo-800 dark:text-indigo-100',
      type: 'audio',
      route: '/folders?type=audio',
    },
    {
      name: 'Documents',
      icon: <FaFileAlt className="text-emerald-600" />,
      bgColor: 'bg-emerald-100 dark:bg-emerald-800',
      borderColor: 'border-emerald-200 dark:border-emerald-700',
      textColor: 'text-emerald-800 dark:text-emerald-100',
      type: 'document',
      route: '/folders?type=document',
    },
  ];

  const folderTypes = [
    { value: 'note', label: 'Notes', icon: <FaStickyNote /> },
    { value: 'image', label: 'Images', icon: <FaImage /> },
    { value: 'video', label: 'Videos', icon: <FaVideo /> },
    { value: 'audio', label: 'Audio', icon: <FaMusic /> },
    { value: 'document', label: 'Documents', icon: <FaFileAlt /> },
    { value: 'pdf', label: 'PDFs', icon: <FaFilePdf /> },
  ];

  const filteredFolders = folders.filter(
    (folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main
      className={`flex-1 p-2 md:p-6 pt-32 md:pt-6 pb-8 overflow-y-auto ${
        theme === 'dark' ? 'dark' : ''
      }`}
    >
      {/* Fixed transparent header for small screens */}
      <header className="fixed top-0 left-0 w-full md:mb-12 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 md:static md:bg-transparent md:dark:bg-transparent md:border-none transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 py-3 md:px-0 md:py-0 max-w-7xl mx-auto">
          <div className="flex items-center w-full">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <form onSubmit={handleNameEdit} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all w-full max-w-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!spaceName.trim()}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSpaceName(lastSavedName); // <- if you're tracking original
                      }}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <motion.h1
                  whileHover={{ scale: 1.01 }}
                  className="text-2xl md:text-3xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100"
                >
                  {spaceName}
                  <FaEdit
                    className="cursor-pointer text-indigo-500 hover:text-indigo-700 transition-colors"
                    onClick={() => {
                      setIsEditing(true);
                      setLastSavedName(spaceName); // <- optional state to restore on cancel
                    }}
                  />
                </motion.h1>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-700 dark:text-gray-300 focus:outline-none ml-2"
              aria-label="Open sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          <div className="relative w-full md:w-78 max-w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-[#eee] dark:bg-gray-800 shadow- focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-150 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Clear search"
              >
                <FaTimes className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors" />
              </button>
            )}
          </div>
        </div>
      </header>

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Category Cards (not links, just display) */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 mb-8">
          {fileCategories.map((cat) => (
            <div
              key={cat.name}
              className={`border p-3 sm:p-4 rounded-md sm:rounded-lg shadow-xs sm:shadow-sm transition-all duration-200 ${cat.bgColor} ${cat.textColor} ${cat.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm xs:text-base font-medium sm:font-semibold line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs xs:text-sm opacity-80 mt-0.5">
                    {folders.filter((f) => f.type === cat.type).length}{' '}
                    {folders.filter((f) => f.type === cat.type).length === 1
                      ? 'folder'
                      : 'folders'}
                  </p>
                </div>
                <div className="text-xl xs:text-2xl sm:text-3xl ml-2">
                  {React.cloneElement(cat.icon, {
                    className: 'w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Folder Section */}
        <div className="mb-6">
          <button
            onClick={() => setShowFolderForm(!showFolderForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow"
          >
            <FaFolderPlus />
            {showFolderForm ? 'Cancel' : 'Create New Folder'}
          </button>
        </div>

        {/* Folder Creation Form */}
        <AnimatePresence>
          {showFolderForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleFolderCreate}
              className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Create New Folder
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={folderForm.name}
                    onChange={(e) =>
                      setFolderForm({ ...folderForm, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:bg-gray-700 dark:text-gray-100"
                    placeholder="e.g. Project Documents"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Folder Type
                  </label>
                  <select
                    value={folderForm.type}
                    onChange={(e) =>
                      setFolderForm({ ...folderForm, type: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:bg-gray-700 dark:text-gray-100"
                  >
                    {folderTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Folder
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Folders List */}
        <div className="mb-4 flex items-center justify-between text-gray-900 dark:text-gray-100">
          <h2 className="text-xl font-semibold">Your Folders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredFolders.length}{' '}
            {filteredFolders.length === 1 ? 'folder' : 'folders'}
          </p>
        </div>

        {filteredFolders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-900 dark:text-gray-100">
            <FaFolder className="mx-auto text-5xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
              No folders found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first folder to get started'}
            </p>
            <button
              onClick={() => setShowFolderForm(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 z-0">
            {filteredFolders.map((folder) => {
              const icon = fileIcons[folder.type] || fileIcons['default'];

              return (
                <motion.div
                  key={folder.id}
                  whileHover={{ y: 0, boxShadow: '0 2px 8px -5px rgba(0, 0, 0, 1)' }}
                  onMouseEnter={() => setHoveredFolder(folder.id)}
                  onMouseLeave={() => setHoveredFolder(null)}
                  className="relative border border-gray-300 dark:border-gray-700 p-3 lg:p-5 bg-[#e7e5e9] dark:bg-gray-700 rounded-lg shadow-sm transition-all duration-200 text-gray-900 dark:text-gray-100"
                >
                  {/* Folder Actions Menu */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionsMenu(
                          showActionsMenu === folder.id ? null : folder.id
                        );
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <FaEllipsisV />
                    </button>

                    <AnimatePresence>
                      {showActionsMenu === folder.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          ref={(el) => (menuRefs.current[folder.id] = el)}
                          className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 shadow-lg rounded-md py-1 z-50"
                        >
                          <button
                            onClick={() => handleFolderAction(folder, 'rename')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleFolderAction(folder, 'download')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleFolderAction(folder, 'delete')}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                          >
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/folders/${folder.id}?type=${folder.type}`)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{icon}</div>
                      <h3 className="text-lg font-semibold truncate">
                        {folder.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {folder.fileCount}{' '}
                        {folder.fileCount === 1 ? 'file' : 'files'}
                      </span>
                      <span>{new Date(folder.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Rename Folder Modal */}
      <AnimatePresence>
        {isRenameModalOpen && folderToRename && (
          <RenameModal
            isOpen={isRenameModalOpen}
            onClose={() => setIsRenameModalOpen(false)}
            onRename={(newName) =>
              handleRenameFolder(folderToRename.id, newName)
            }
            currentName={folderToRename.name}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default DashboardContent;