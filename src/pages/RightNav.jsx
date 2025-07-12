import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell, FaClipboardList, FaFolder, FaFileAlt,
  FaShareAlt, FaInfoCircle, FaEllipsisV,
  FaEnvelope, FaUsers, FaCalendarAlt, FaCog,
  FaReply, FaArchive, FaTag, FaStar, FaCheckCircle, FaTimesCircle,
  FaArrowLeft // Import the new back arrow icon
} from 'react-icons/fa';
import { useTheme } from './ThemeContext'; // Assuming you have this context
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = '/api';

const RightNav = ({ onBackClick }) => { // Add onBackClick prop for back arrow functionality
  const [activeTab, setActiveTab] = useState('activities');
  const [activeSecondaryTab, setActiveSecondaryTab] = useState('messages');
  const navigate = useNavigate();
  // Removed notifications logic
  const [activities, setActivities] = useState([]);
  const [messages, setMessages] = useState([]);
  // Removed notification menu logic
  const { theme } = useTheme();

  const menuRef = useRef(null);
  const ellipsisRef = useRef(null); // Ref for the ellipsis icon button

  const activityLogTypes = ['upload', 'delete', 'create', 'login', 'logout', 'change_settings', 'renamed_folder', 'permission_change', 'system_event', 'new_folder', 'file_upload', 'shared_item'];

  // --- Data Fetching Logic ---
  useEffect(() => {
    const token = localStorage.getItem('myspace_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/activities`, { headers });
        setActivities(response.data.map(act => ({
          ...act,
          time: formatTimeAgo(act.created_at)
        })));
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/messages`, { headers });
        setMessages(response.data.map(msg => ({
          ...msg,
          time: formatTimeAgo(msg.created_at || new Date().toISOString())
        })));
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchActivities();
    fetchMessages();
  }, []);

  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Unknown time';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getActivityDetails = (item) => {
    const { type, file_name, folder_name, data, target_type } = item;
    const userName = data?.user || 'You';
    const targetName = file_name || folder_name;

    switch (type) {
      case 'login': return `${userName} logged in.`;
      case 'logout': return `${userName} logged out.`;
      case 'change_settings': return `${userName} changed settings: ${data?.setting || 'various settings'}.`;
      case 'renamed_folder': return `${userName} renamed folder "${data?.old_name || 'unknown'}" to "${folder_name || 'unknown'}".`;
      case 'permission_change': return `${userName} changed permissions on ${targetName ? `"${targetName}"` : 'an item'}.`;
      case 'system_event': return `System event: ${data?.event_description || 'An unspecific system event occurred.'}`;
      case 'upload': return `${userName} uploaded ${data?.count || 'a'} new ${target_type === 'file' ? 'file' : 'item'}${data?.count > 1 ? 's' : ''}${targetName ? ` "${targetName}"` : ''}.`;
      case 'delete': return `${userName} deleted a ${target_type === 'file' ? 'file' : 'folder'}${targetName ? ` "${targetName}"` : ''}.`;
      case 'create': return `${userName} created a new ${target_type === 'file' ? 'file' : 'folder'}${targetName ? ` "${targetName}"` : ''}.`;
      case 'new_folder': return `${userName} created a new folder "${folder_name || 'unknown folder'}".`;
      case 'file_upload': return `${userName} uploaded a file "${file_name || 'unknown file'}".`;
      case 'shared_item': return `${userName} shared "${file_name || folder_name || 'an item'}" with ${data?.recipient || 'someone'}.`;
      default: return `Performed ${type.replace(/_/g, ' ')}.`;
    }
  };

  // Removed notification update logic

  const clearAllActivities = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/activities/clearAll`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('myspace_token')}` },
      });
      setActivities([]);
    } catch (error) {
      console.error("Error clearing all activities:", error);
    }
  };

  // Removed notification icon logic

  // Removed notification menu handlers

  // Only activities section for small screens
  const [activeSmallScreenSection, setActiveSmallScreenSection] = useState('activities');
  const smallScreenSections = [
    { name: 'activities', icon: FaClipboardList, label: 'Activities' },
  ];
  const renderContentForSmallScreen = () => renderActivitiesContent();

  // Removed notifications content

  const renderActivitiesContent = () => (
    <div className="p-2">
      {activities.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center mt-8">
          No recent activities
        </p>
      ) : (
        <AnimatePresence>
          {activities.map(activity => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 p-3 mb-2 rounded-lg bg-gray-100 dark:bg-gray-700/50"
            >
              <div className="flex-shrink-0 mt-1">
                <FaClipboardList className="text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {getActivityDetails(activity)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activity.time}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );

  const renderMessagesContent = () => (
    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
      {messages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No messages
        </p>
      ) : (
        messages.map(message => (
          <div key={message.id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
            <div className="flex justify-between">
              <p className={`text-sm font-medium ${message.unread ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                {message.sender}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {message.time}
              </p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {message.preview}
            </p>
          </div>
        ))
      )}
    </div>
  );


  return (
    <div className={`
      fixed inset-0 z-50 lg:static lg:w-75 lg:flex-shrink-0
      ${theme === 'dark' ? 'dark:border-gray-700 bg-gray-800' : 'border-gray-50 bg-white'}
      flex flex-col h-full
      border-l lg:border-l
    `}>
      {/* Header with Back Arrow and Title (with count) */}
      <div className={`p-3 border-b ${theme === 'dark' ? 'dark:border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mr-3"
            aria-label="Go back"
          >
            <FaArrowLeft size={18} />
          </button>
          <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100">
            <span>Activities ({activities.length})</span>
          </h2>
        </div>
        <button
          onClick={clearAllActivities}
          className="text-xs text-red-600 dark:text-red-400 hover:underline ml-2"
        >
          Clear all
        </button>
      </div>

      {/* Small Screen Top Navigation Bar (only activities) */}
      <div className={`lg:hidden flex justify-between border-b ${theme === 'dark' ? 'dark:border-gray-700' : 'border-gray-200'} overflow-x-auto custom-scroll-x`}>
        {smallScreenSections.map((section) => (
          <button
            key={section.name}
            onClick={() => setActiveSmallScreenSection(section.name)}
            className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-2 text-xs font-medium transition-colors
              ${activeSmallScreenSection === section.name
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <section.icon className="mb-1" size={16} />
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Large Screen Tab Navigation removed */}
      {/* ...existing code... */}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {/* Only activities for both screen sizes */}
        {renderActivitiesContent()}
      </div>
    </div>
  );
};

export default RightNav;