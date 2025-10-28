import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import ScrollRestoration from './utils/scrollrestoration';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import layoutStyles from './utils/styles/layout.module.css';

import Menu from './features/Menu/features';
import BlankPage from './components/BlankPage';
import Content from './features/Content/Home';
import Profile from './features/Content/Profile';
import Matches from './features/Content/Matches';

import Login from './features/Login';
import ForgotPassword from '../src/features/ForgotPassword';
import SignUp from './features/SignUp';
import EmailVerification from './features/EmailVerification';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.post(`${API_URL}/refresh`, {}, { withCredentials: true });
        setIsLoggedIn(true);
      } catch (err) {
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
            <Route path="/signup" element={<SignUp />} />
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
                        <Route path="/matches" element={
                          <OverlayScrollbarsComponent
                            options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                            overflow: { x: 'hidden', y: 'scroll' } }}
                            className="content">
                            <Matches />
                          </OverlayScrollbarsComponent>
                        } />
                        <Route path="/profile/:userId" element={<Profile />} />
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