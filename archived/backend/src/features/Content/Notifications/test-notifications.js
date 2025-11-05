// Test utility for creating notifications
// This can be used to test the notification system

export const createTestNotification = async (userId, type = 'match', title = 'Test Notification', message = 'This is a test notification') => {
  try {
    const response = await fetch('http://localhost:8081/api/notifications/create', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        type,
        title,
        message,
        data: JSON.stringify({ test: true })
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Test notification created:', data);
      return data;
    } else {
      console.error('Failed to create test notification:', response.status);
    }
  } catch (error) {
    console.error('Error creating test notification:', error);
  }
};

// Usage example:
// createTestNotification('user123', 'match', 'New Match!', 'You have a new match!');
