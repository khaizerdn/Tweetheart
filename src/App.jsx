import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import ScrollRestoration from './utils/scrollrestoration';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import layoutStyles from './utils/styles/layout.module.css';

import Menu from './features/Menu/features';
import Complementary from './features/Complementary/Complementary';

import SearchPageMain from './features/Content/SearchPage';
import ContentProfile from './features/Content/UserProfile/UserProfile';
import ContentHome from './features/Content/content-home';
import ContentNotifications from './features/Content/content-notifications';
import ContentTrends from './features/Content/content-trends';
import ContentTournament from './features/Content/content-tournament';
import ContentScrimmage from './features/Content/content-scrimmage';
import ContentChats from './features/Content/content-chats';
import ContentFriends from './features/Content/content-friends';
import ContentTeams from './features/Content/content-teams';
import ContentOrganizations from './features/Content/content-organizations';
import ContentPages from './features/Content/content-pages';
import ContentSettings from './features/Content/content-settings';

import Login from './features/Login';
import ForgotPassword from '../src/features/ForgotPassword';
import CreateAccount from './features/CreateAccount';
import EmailVerification from './features/EmailVerification';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(
    <div>
      <h2>For You Content</h2>
      <p>This section is tailored just for you!</p>
    </div>
  );
  const [dropdownLabel, setDropdownLabel] = useState(
    () => localStorage.getItem('dropdownLabel') || "For you"
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.post(`${API_URL}/refresh`, {}, { withCredentials: true });
        console.log("[CLIENT] Refresh successful:", res.data.message);
        setIsLoggedIn(true);
      } catch (err) {
        console.log("[CLIENT] No valid session, user must login.");
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const ProtectedRoute = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/" />;
  };

  if (loading) {
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
            <Route path="/createaccount" element={<CreateAccount />} />
            <Route path="/verification" element={<EmailVerification />} />
            <Route path="/reset-password" element={<EmailVerification />} />
          </>
        ) : (
          <Route
            path="*"
            element={
              <ProtectedRoute>
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
                        <Menu setDropdownLabel={setDropdownLabel} />
                      </OverlayScrollbarsComponent>
                    </div>
                    <div className="container-content">
                      <OverlayScrollbarsComponent
                        options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                        overflow: { x: 'hidden', y: 'scroll' } }}
                        className="content">
                        <Routes>
                          <Route path="*" element={<Navigate to="/" />} />
                          <Route
                            path="/"
                            element={
                              <ContentHome
                                content={content}
                                setContent={setContent}
                                dropdownLabel={dropdownLabel}
                                setDropdownLabel={setDropdownLabel}
                              />
                            }
                          />
                          <Route path="/search" element={<SearchPageMain />} />
                          <Route path="/notifications" element={<ContentNotifications />} />
                          <Route path="/trends" element={<ContentTrends />} />
                          <Route path="/tournament" element={<ContentTournament />} />
                          <Route path="/scrimmage" element={<ContentScrimmage />} />
                          <Route path="/chats" element={<ContentChats />} />
                          <Route path="/friends" element={<ContentFriends />} />
                          <Route path="/teams" element={<ContentTeams />} />
                          <Route path="/organizations" element={<ContentOrganizations />} />
                          <Route path="/pages" element={<ContentPages />} />
                          <Route path="/settings" element={<ContentSettings />} />
                          <Route path="/:username/*" element={<ContentProfile />} />
                        </Routes>
                      </OverlayScrollbarsComponent>
                    </div>
                    <div className={layoutStyles.containerComplementary}>
                      <OverlayScrollbarsComponent
                        options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                        overflow: { x: 'hidden', y: 'scroll' } }}
                        className={layoutStyles.complementary}>
                        <Complementary />
                      </OverlayScrollbarsComponent>
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