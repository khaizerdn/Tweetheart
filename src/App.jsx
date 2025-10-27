import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import ScrollRestoration from './utils/scrollrestoration';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import layoutStyles from './utils/styles/layout.module.css';

import Menu from './features/Menu/features';
import BlankPage from './components/BlankPage';
import Content from './features/Content/Home';

import Login from './features/Login';
import ForgotPassword from '../src/features/ForgotPassword';
import CreateAccount from './features/CreateAccount';
import EmailVerification from './features/EmailVerification';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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
                        <Menu />
                      </OverlayScrollbarsComponent>
                    </div>
                    <div className="container-content">
                      <OverlayScrollbarsComponent
                        options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0, },
                        overflow: { x: 'hidden', y: 'hidden' } }}
                        className="content">
                        <Routes>
                          <Route path="/" element={<Content />} />
                          <Route path="*" element={<BlankPage />} />
                        </Routes>
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