import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import MobileMenu from "../../../components/MobileMenu";
import styles from "./styles.module.css";

function Settings() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to dark mode, but check saved preference or system preference
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'dark');
    setIsDarkMode(initialTheme === 'dark');
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', initialTheme);
    setIsLoading(false);
  }, []);

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save preference to localStorage
    localStorage.setItem('theme', newTheme);
  };

  if (isLoading) {
    return (
      <div className={styles.settingsPage}>
        <Header title="Settings" className={styles.settingsHeader} />
        <div className={styles.containerAccess}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingMessage}>Loading settings...</div>
          </div>
        </div>
        <MobileMenu />
      </div>
    );
  }

  return (
    <div className={styles.settingsPage}>
      <Header title="Settings" className={styles.settingsHeader} />
      <div className={styles.containerAccess}>
        <div className={styles.settingsContainer}>
          <div className={styles.settingsCard}>
            <div className={styles.settingsContent}>
            {/* Theme Toggle Section */}
            <div className={styles.settingSection}>
              <div className={styles.settingInfo}>
                <h3>Dark Mode</h3>
              </div>
              
              <div className={styles.themeToggleContainer}>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="theme-toggle"
                    checked={isDarkMode}
                    onChange={handleThemeToggle}
                    className={styles.toggleInput}
                  />
                  <label htmlFor="theme-toggle" className={styles.toggleLabel}>
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <MobileMenu />
    </div>
  );
}

export default Settings;
