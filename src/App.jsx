import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import FolderPage from './pages/FolderPage';
import TrashPage from './pages/TrashPage';
import RightNav from './pages/RightNav.jsx';
import { ThemeProvider } from './pages/ThemeContext';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';

import './App.css';

const App = () => {
  return (
    <ThemeProvider>
    <Router>
      <div className="min-h-screen font-sans bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/folders/:folderId" element={<FolderPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/notifications" element={<RightNav />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* Add more routes as needed */} 
        </Routes>
      </div>
    </Router>
    </ThemeProvider>
  );
};

export default App;
