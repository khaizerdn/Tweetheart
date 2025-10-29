import React, { useState, useEffect } from "react";
import Button from "../../../components/Buttons/Button";
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
      <div className={styles.containerAccess}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingMessage}>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.containerAccess}>
      <div className={styles.settingsContainer}>
        <div className={styles.settingsCard}>
          <div className={styles.settingsHeader}>
            <h1>Settings</h1>
            <p>Customize your app experience</p>
          </div>

          <div className={styles.settingsContent}>
            {/* Theme Toggle Section */}
            <div className={styles.settingSection}>
              <div className={styles.settingInfo}>
                <h3>Appearance</h3>
                <p>Choose your preferred theme</p>
              </div>
              
              <div className={styles.themeToggleContainer}>
                <div className={styles.themeOption}>
                  <div className={`${styles.themePreview} ${!isDarkMode ? styles.active : ''}`}>
                    <div className={styles.themePreviewContent}>
                      <div className={styles.themePreviewHeader}></div>
                      <div className={styles.themePreviewBody}></div>
                    </div>
                  </div>
                  <span className={styles.themeLabel}>Light</span>
                </div>

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

                <div className={styles.themeOption}>
                  <div className={`${styles.themePreview} ${isDarkMode ? styles.active : ''}`}>
                    <div className={styles.themePreviewContent}>
                      <div className={styles.themePreviewHeader}></div>
                      <div className={styles.themePreviewBody}></div>
                    </div>
                  </div>
                  <span className={styles.themeLabel}>Dark</span>
                </div>
              </div>
            </div>

            {/* Theme Test Section */}
            <div className={styles.settingSection}>
              <div className={styles.settingInfo}>
                <h3>Theme Test</h3>
                <p>Current theme colors preview</p>
              </div>
              <div className={styles.themeTestContainer}>
                <div className={styles.colorTest} style={{ backgroundColor: 'var(--color-primary-1)', color: 'var(--color-primary-26)' }}>
                  Primary 1
                </div>
                <div className={styles.colorTest} style={{ backgroundColor: 'var(--color-primary-26)', color: 'var(--color-primary-1)' }}>
                  Primary 26
                </div>
                <div className={styles.colorTest} style={{ backgroundColor: 'var(--background-color-1)', color: 'var(--font-color-default)' }}>
                  Background 1
                </div>
              </div>
            </div>

            {/* Additional Settings Sections */}
            <div className={styles.settingSection}>
              <div className={styles.settingInfo}>
                <h3>Notifications</h3>
                <p>Manage your notification preferences</p>
              </div>
              <div className={styles.settingAction}>
                <Button type="secondary" position="center">
                  Configure
                </Button>
              </div>
            </div>

            <div className={styles.settingSection}>
              <div className={styles.settingInfo}>
                <h3>Privacy</h3>
                <p>Control your privacy settings</p>
              </div>
              <div className={styles.settingAction}>
                <Button type="secondary" position="center">
                  Manage
                </Button>
              </div>
            </div>

            <div className={styles.settingSection}>
              <div className={styles.settingInfo}>
                <h3>Account</h3>
                <p>Manage your account settings</p>
              </div>
              <div className={styles.settingAction}>
                <Button type="secondary" position="center">
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
