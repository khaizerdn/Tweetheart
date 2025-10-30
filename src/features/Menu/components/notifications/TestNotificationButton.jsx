import React, { useState } from 'react';
import styles from './styles.module.css';

const TestNotificationButton = () => {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const getCurrentUserId = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('userId='))
      ?.split('=')[1];
  };

  const sendTest = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setLastResult('No userId cookie found');
      return;
    }

    try {
      setSending(true);
      setLastResult(null);
      const response = await fetch('http://localhost:8081/api/notifications/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'match',
          title: 'Test Notification',
          message: `This is a test at ${new Date().toLocaleTimeString()}`,
          data: { test: true }
        })
      });

      if (!response.ok) {
        setLastResult(`Failed (${response.status})`);
        return;
      }

      const data = await response.json();
      setLastResult('Sent');
      // Socket emission from server should display tray automatically
    } catch (e) {
      setLastResult('Error sending');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.testControls}>
      <button className={styles.testButton} onClick={sendTest} disabled={sending}>
        {sending ? 'Sending…' : 'Send Test Notification'}
      </button>
      {lastResult && <span className={styles.testResult}>{lastResult}</span>}
    </div>
  );
};

export default TestNotificationButton;


