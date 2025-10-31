// Chat-related API functions

const API_URL = import.meta.env.VITE_API_URL || '';

// Fetch all chat conversations for the current user
export const fetchChats = async () => {
  try {
    const response = await fetch(`${API_URL}/api/chats`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chats: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

// Fetch messages for a specific chat
export const fetchChatMessages = async (chatId) => {
  try {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat messages: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

// Send a message to a chat
export const sendChatMessage = async (chatId, message) => {
  try {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Create a new chat with a match
export const createChat = async (matchId) => {
  try {
    const response = await fetch(`${API_URL}/api/chats`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId })
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Delete a chat
export const deleteChat = async (chatId) => {
  try {
    const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId) => {
  try {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/read`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to mark messages as read: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};
