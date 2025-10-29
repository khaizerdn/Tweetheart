import requestAccessToken from '../../../api/requestAccessToken';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch all notifications for the current user
 * @returns {Promise<Array>} Array of notification objects
 */
export const fetchNotifications = async () => {
  try {
    const response = await requestAccessToken.get('/api/notifications');
    return response.data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

/**
 * Mark a specific notification as read
 * @param {string|number} notificationId - The ID of the notification to mark as read
 * @returns {Promise<Object>} Response from the server
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await requestAccessToken.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

/**
 * Mark all notifications as read for the current user
 * @returns {Promise<Object>} Response from the server
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await requestAccessToken.put('/api/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

/**
 * Delete a specific notification
 * @param {string|number} notificationId - The ID of the notification to delete
 * @returns {Promise<Object>} Response from the server
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await requestAccessToken.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};

/**
 * Get notification settings for the current user
 * @returns {Promise<Object>} Notification settings object
 */
export const getNotificationSettings = async () => {
  try {
    const response = await requestAccessToken.get('/api/notifications/settings');
    return response.data.settings || {};
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw new Error('Failed to fetch notification settings');
  }
};

/**
 * Update notification settings for the current user
 * @param {Object} settings - The notification settings to update
 * @returns {Promise<Object>} Response from the server
 */
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await requestAccessToken.put('/api/notifications/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw new Error('Failed to update notification settings');
  }
};

/**
 * Get unread notification count
 * @returns {Promise<number>} Number of unread notifications
 */
export const getUnreadCount = async () => {
  try {
    const response = await requestAccessToken.get('/api/notifications/unread-count');
    return response.data.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw new Error('Failed to fetch unread count');
  }
};

/**
 * Create a test notification (for development/testing purposes)
 * @param {Object} notificationData - The notification data to create
 * @returns {Promise<Object>} Response from the server
 */
export const createTestNotification = async (notificationData) => {
  try {
    const response = await requestAccessToken.post('/api/notifications/test', notificationData);
    return response.data;
  } catch (error) {
    console.error('Error creating test notification:', error);
    throw new Error('Failed to create test notification');
  }
};
