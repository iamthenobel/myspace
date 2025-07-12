import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft,
  FaUpload,
  FaPencilAlt,
  FaEllipsisV,
  FaThumbtack,
  FaTrash,
  FaCog,
} from 'react-icons/fa';

function Sidebar({
  isMobile = false,
  onClose = () => {},
  navigate,
  files,
  folder,
  handleScrollTo,
  getFileIcon,
  setShowNoteEditor,
  menuOpen,
  setMenuOpen,
  spaceName,
}) {
  return (
    <motion.aside
      initial={isMobile ? { x: -300 } : false}
      animate={isMobile ? { x: 0 } : false}
      exit={isMobile ? { x: -300 } : false}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`w-80 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full z-10
        ${isMobile ? 'fixed md:hidden' : 'hidden md:flex static'}`}
    >
      {/* Header */}
      <div className="hidden md:block px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm font-medium"
          onClick={() => navigate(-1)}
        >
          <div className="flex items-center gap-1">
            <FaArrowLeft className="text-sm" />
            <span>Back</span>
          </div>
        </button>
      </div>

      <div className="md:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
          {spaceName || "It's your space. Enjoy!"}
        </span>
        {isMobile && (
          <button onClick={onClose} aria-label="Close sidebar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2 custom-scroll">
        <div className="px-3 space-y-1">
          {files.map((file) => (
            <motion.div
              key={file.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              onClick={() => handleScrollTo(file.id)}
            >
              <span className="text-indigo-500 text-sm">{getFileIcon(file.type)}</span>
              <span className="text-sm ml-2 truncate flex-1">{file.name}</span>
              {file.pinned && <FaThumbtack className="text-indigo-500 text-xs transform rotate-45" />}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
          onClick={() => document.getElementById('upload-input').click()}
        >
          <FaUpload className="text-sm" />
          <span>Upload Files</span>
        </motion.button>

        {folder?.type === 'note' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
            onClick={() => setShowNoteEditor(true)}
          >
            <FaPencilAlt className="text-sm" />
            <span>Create Note</span>
          </motion.button>
        )}

        <div
          className="relative"
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <FaEllipsisV className="text-sm" />
            <span>Actions</span>
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="submenu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-20 border border-gray-200 dark:border-gray-700"
              >
                <button
                  className="w-full text-left p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  onClick={() => window.toast && window.toast.info ? window.toast.info('Coming soon!') : alert('Coming soon!')}
                >
                  <FaCog className="text-gray-500 dark:text-gray-400 text-sm" />
                  <span>Space Settings</span>
                </button>
                <button
                  className="w-full text-left p-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2"
                  onClick={() => window.toast && window.toast.info ? window.toast.info('Coming soon!') : alert('Coming soon!')}
                >
                  <FaTrash className="text-sm" />
                  <span>Delete Space</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
