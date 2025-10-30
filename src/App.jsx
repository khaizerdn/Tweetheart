import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import ScrollRestoration from './utils/scrollrestoration';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import layoutStyles from './utils/styles/layout.module.css';

import Menu from './features/Menu/features';
import BlankPage from './components/BlankPage';
import Content from './features/Content/Home';
import ProfileWrapper from './features/Content/ProfileWrapper';
import Matches from './features/Content/Matches';
import Chats from './features/Content/Chats';
import ChatRoom from './features/Content/Chats/ChatRoom';
import Settings from './features/Content/Settings';
import Notifications from './features/Content/Notifications';

import Login from './features/Login';
import ForgotPassword from '../src/features/ForgotPassword';
import SignUp from './features/SignUp';
import EmailVerification from './features/EmailVerification';
import LocationPermission from './components/LocationPermission';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.post(`${API_URL}/refresh`, {}, { withCredentials: true });
        setIsLoggedIn(true);
        
        // Check if user has location saved
        try {
          const locationRes = await axios.get(`${API_URL}/location-status`, { withCredentials: true });
          if (!locationRes.data.hasLocation) {
            setShowLocationModal(true);
          }
        } catch (locationErr) {
          console.error("Error checking location status:", locationErr);
        }
        
        setLocationChecked(true);
      } catch (err) {
        setIsLoggedIn(false);
        setLocationChecked(true);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    // Check location status after login
    setTimeout(async () => {
      try {
        const locationRes = await axios.get(`${API_URL}/location-status`, { withCredentials: true });
        if (!locationRes.data.hasLocation) {
          setShowLocationModal(true);
        }
        setLocationChecked(true);
      } catch (locationErr) {
        console.error("Error checking location status:", locationErr);
        setLocationChecked(true);
      }
    }, 100); // Small delay to ensure cookies are set
  };
  
  const handleLocationGranted = () => {
    setShowLocationModal(false);
  };

  const ProtectedRoute = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/" />;
  };

  if (loading || (isLoggedIn && !locationChecked)) {
    return <div>Loading session...</div>;
  }

  return (
    <Router>
      <ScrollRestoration />
      <Routes>
        {!isLoggedIn ? (
          <>
            <Route path="*" element={<Navigate to="/" />} />
            <Route path="/" element={<Login setIsLoggedIn={handleLogin} />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verification" element={<EmailVerification />} />
            <Route path="/reset-password" element={<EmailVerification />} />
          </>
        ) : (
          <Route
            path="*"
            element={
              <ProtectedRoute>
                {showLocationModal && (
                  <LocationPermission onLocationGranted={handleLocationGranted} />
                )}
                <div className="container">
                  <div className="container-titleBar">
                    <div className="titleBar"></div>
                  </div>
                  <div className="main-container">
                    <div className={layoutStyles.containerShortcut}>
                      <OverlayScrollbarsComponent
                        options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                        overflow: { x: 'hidden', y: 'scroll' } }}
                        className={layoutStyles.shortcut}>
                        <Menu />
                      </OverlayScrollbarsComponent>
                    </div>
                    <div className="container-content">
                      <Routes>
                        <Route path="/" element={
                          <OverlayScrollbarsComponent
                            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                            overflow: { x: 'hidden', y: 'hidden' } }}
                            className="content">
                            <Content />
                          </OverlayScrollbarsComponent>
                        } />
                        <Route path="/notifications" element={
                          <OverlayScrollbarsComponent
                            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                            overflow: { x: 'hidden', y: 'scroll' } }}
                            className="content">
                            <Notifications />
                          </OverlayScrollbarsComponent>
                        } />
                        <Route path="/matches" element={
                          <OverlayScrollbarsComponent
                            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                            overflow: { x: 'hidden', y: 'scroll' } }}
                            className="content">
                            <Matches />
                          </OverlayScrollbarsComponent>
                        } />
                        <Route path="/chats" element={
                          <OverlayScrollbarsComponent
                            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                            overflow: { x: 'hidden', y: 'scroll' } }}
                            className="content">
                            <Chats />
                          </OverlayScrollbarsComponent>
                        } />
                        <Route path="/chats/:chatId" element={<ChatRoom />} />
                        <Route path="/profile/:userId" element={<ProfileWrapper />} />
                        <Route path="/settings" element={
                          <OverlayScrollbarsComponent
                            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                            overflow: { x: 'hidden', y: 'scroll' } }}
                            className="content">
                            <Settings />
                          </OverlayScrollbarsComponent>
                        } />
                        <Route path="*" element={
                          <OverlayScrollbarsComponent
                            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                            overflow: { x: 'hidden', y: 'hidden' } }}
                            className="content">
                            <BlankPage />
                          </OverlayScrollbarsComponent>
                        } />
                      </Routes>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        )}
      </Routes>
    </Router>
  );
}

export default App;