// Mock API service for static site
// Intercepts all API calls and returns mock data

import {
  currentUser,
  mockUsers,
  mockMatches,
  mockChats,
  getUserById,
  getMessagesForChat,
  isMatch,
  recordInteraction,
  getFeedUsers,
  userInteractions,
  getNotifications
} from './mockData.js';

// Simulate network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Create mock response
const mockResponse = (data, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {},
  config: {}
});

// Mock axios instance
const createMockAxios = () => {
  const instance = {
    get: async (url, config) => {
      await delay();
      return handleGet(url, config);
    },
    post: async (url, data, config) => {
      await delay();
      return handlePost(url, data, config);
    },
    put: async (url, data, config) => {
      await delay();
      return handlePut(url, data, config);
    },
    delete: async (url, config) => {
      await delay();
      return handleDelete(url, config);
    },
    interceptors: {
      request: { use: () => {}, eject: () => {} },
      response: { use: () => {}, eject: () => {} }
    },
    create: () => createMockAxios()
  };
  return instance;
};

// Handle GET requests
const handleGet = async (url, config) => {
  console.log('[Mock API] GET:', url);
  
  // User profile endpoints
  if (url.includes('/user-profile')) {
    if (url.includes('/user-profile/')) {
      // Other user's profile
      const userId = url.split('/user-profile/')[1];
      const user = getUserById(userId);
      if (user) {
        return mockResponse({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          bio: user.bio,
          birthdate: user.birthdate,
          age: user.age
        });
      }
    } else {
      // Current user's profile - return in camelCase format as expected by frontend
      return mockResponse({
        id: currentUser.id,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name,
        bio: currentUser.bio,
        birthDate: currentUser.birthdate,
        gender: currentUser.gender || 'male',
        email: currentUser.email
      });
    }
  }
  
  // Photos endpoints
  if (url.includes('/photos')) {
    if (url.includes('/photos/')) {
      // Other user's photos
      const userId = url.split('/photos/')[1];
      const user = getUserById(userId);
      return mockResponse({
        photos: user?.photos || []
      });
    } else {
      // Current user's photos - order starts from 1 (not 0) as required by system
      return mockResponse({
        photos: currentUser.photos.map((url, index) => ({
          url,
          key: `photo-${index}`,
          order: index + 1 // Order starts from 1, not 0
        }))
      });
    }
  }
  
  // User feed
  if (url.includes('/users/feed')) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '10');
    const minAge = parseInt(params.get('minAge') || '18');
    const maxAge = parseInt(params.get('maxAge') || '99');
    const distance = parseInt(params.get('distance') || '50');
    
    const result = getFeedUsers(page, limit, { minAge, maxAge, distance });
    
    // Transform users to match expected format
    const transformedUsers = result.users.map(u => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`, // Combine first and last name
      age: u.age,
      bio: u.bio,
      gender: u.gender || '', // Add gender field
      photos: u.photos || [],
      distance: u.location?.distance || null // Extract distance from location
    }));
    
    return mockResponse({
      users: transformedUsers,
      pagination: {
        currentPage: result.page,
        hasMore: result.hasMore,
        totalUsers: result.total
      }
    });
  }
  
  // Matches
  if (url.includes('/likes/matches')) {
    return mockResponse({
      matches: mockMatches
    });
  }
  
  // Get match by ID (for ChatRoom)
  if (url.includes('/matches/')) {
    const matchId = url.split('/matches/')[1];
    const match = mockMatches.find(m => m.id === matchId);
    if (match) {
      return mockResponse({
        match: match
      });
    }
    return mockResponse({ error: 'Match not found' }, 404);
  }
  
  // Liked users (users you've liked)
  if (url.includes('/likes/liked')) {
    // Return empty array initially, or users that have been liked
    return mockResponse({
      likedUsers: []
    });
  }
  
  // Passed users (users you've passed)
  if (url.includes('/likes/passed')) {
    // Return empty array initially, or users that have been passed
    return mockResponse({
      passedUsers: []
    });
  }
  
  // Chats
  if (url.includes('/chats')) {
    if (url.includes('/chats/') && url.includes('/messages')) {
      // Chat messages
      const chatId = url.split('/chats/')[1].split('/messages')[0];
      const messages = getMessagesForChat(chatId);
      return mockResponse({
        messages: messages.map(msg => ({
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          message: msg.message,
          created_at: msg.created_at,
          is_read: msg.is_read
        }))
      });
    } else {
      // All chats - transform to include proper structure with photos and bio
      const transformedChats = mockChats.map(chat => {
        const match = mockMatches.find(m => m.id === chat.match_id);
        const user = getUserById(chat.match_id);
        const photos = user?.photos || match?.photos || [];
        
        return {
          id: chat.id,
          other_user: {
            id: chat.match_id,
            name: chat.match_name,
            age: user?.age || match?.age || null,
            gender: user?.gender || 'male',
            bio: user?.bio || match?.bio || '',
            photos: photos.map(url => ({ url })) // Transform to array of photo objects
          },
          last_message: chat.last_message,
          last_message_time: chat.last_message_time,
          unread_count: chat.unread_count,
          is_read: chat.is_read
        };
      });
      
      return mockResponse({
        chats: transformedChats
      });
    }
  }
  
  // Notifications - return all notifications (including 'like' types for swiping)
  if (url.includes('/notifications')) {
    const allNotifications = getNotifications();
    // Return all notifications (match and like types)
    return mockResponse({
      notifications: allNotifications
    });
  }
  
  // User basic info - return in camelCase format as expected by Menu component
  if (url.includes('/user-basic')) {
    return mockResponse({
      id: currentUser.id,
      firstName: currentUser.first_name,
      lastName: currentUser.last_name,
      photos: currentUser.photos
    });
  }
  
  // Location status
  if (url.includes('/location-status')) {
    return mockResponse({
      hasLocation: true
    });
  }
  
  // User basic info by ID (for notifications to display user info)
  if (url.includes('/users/') && url.includes('/basic')) {
    const userId = url.split('/users/')[1].split('/basic')[0];
    const user = getUserById(userId);
    if (user) {
      // Transform photos to array of objects with url and order
      const photos = (user.photos || []).map((url, index) => ({
        url: url,
        order: index + 1
      }));
      
      return mockResponse({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        gender: user.gender || 'male',
        birthdate: user.birthdate,
        photos: photos
      });
    }
    return mockResponse({ error: 'User not found' }, 404);
  }
  
  return mockResponse({ error: 'Endpoint not found' }, 404);
};

// Handle POST requests
const handlePost = async (url, data, config) => {
  console.log('[Mock API] POST:', url, data);
  
  // Login
  if (url.includes('/login')) {
    // Accept any email/password for demo
    return mockResponse({
      success: true,
      message: 'Login successful'
    });
  }
  
  // Refresh token
  if (url.includes('/refresh')) {
    return mockResponse({
      success: true,
      message: 'Token refreshed'
    });
  }
  
  // Logout
  if (url.includes('/logout')) {
    return mockResponse({
      success: true,
      message: 'Logout successful'
    });
  }
  
  // Signup
  if (url.includes('/signup')) {
    return mockResponse({
      success: true,
      message: 'Account created successfully'
    });
  }
  
  // Verify account
  if (url.includes('/verify-account')) {
    return mockResponse({
      success: true,
      message: 'Account verified'
    });
  }
  
  // Resend code
  if (url.includes('/resend-code')) {
    return mockResponse({
      success: true,
      message: 'Code resent'
    });
  }
  
  // Check email
  if (url.includes('/check-email')) {
    return mockResponse({
      exists: true,
      message: 'Email found'
    });
  }
  
  // Verify code
  if (url.includes('/fp-verifycode')) {
    return mockResponse({
      success: true,
      message: 'Code verified'
    });
  }
  
  // Reset password
  if (url.includes('/reset-password')) {
    return mockResponse({
      success: true,
      message: 'Password reset successful'
    });
  }
  
  // Like/pass user
  if (url.includes('/likes') && !url.includes('/matches') && !url.includes('/liked') && !url.includes('/passed')) {
    const { liked_id, like_type } = data;
    const result = recordInteraction(liked_id, like_type);
    
    // If it's a like action, create a notification
    if (like_type === 'like') {
      const likedUser = getUserById(liked_id);
      if (likedUser) {
        const userName = `${likedUser.first_name} ${likedUser.last_name}`;
        
        // Create a notification for the like (only if it's a match, we'll handle that separately)
        // For now, create a simple "You liked someone" notification if it becomes a match
        if (result.isMatch) {
          // Match notification will be created by the notification system
          // We can add it to the mock notifications array
          const matchNotification = {
            id: `notif-${Date.now()}`,
            type: 'match',
            title: 'New Match!',
            message: `You and ${userName} liked each other!`,
            data: JSON.stringify({ matchUserId: liked_id, matchUserName: userName }),
            is_read: false,
            is_dismissed: false,
            created_at: new Date().toISOString()
          };
          // Add to mockNotifications (we'll need to import it or manage it)
        }
      }
    }
    
    return mockResponse(result);
  }
  
  // Create chat
  if (url.includes('/chats') && !url.includes('/messages')) {
    const { matchId } = data;
    return mockResponse({
      success: true,
      chat: {
        id: `chat-${matchId}`,
        match_id: matchId,
        created_at: new Date().toISOString()
      }
    });
  }
  
  // Send message
  if (url.includes('/chats/') && url.includes('/messages')) {
    const chatId = url.split('/chats/')[1].split('/messages')[0];
    const { message } = data;
    
    return mockResponse({
      success: true,
      message: {
        id: `msg-${Date.now()}`,
        chat_id: chatId,
        sender_id: currentUser.id,
        sender_name: currentUser.first_name,
        message: message,
        created_at: new Date().toISOString(),
        is_read: false
      }
    });
  }
  
  // Upload photos
  if (url.includes('/photos/upload') || url.includes('/photos/upload-multiple')) {
    return mockResponse({
      success: true,
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
          key: `photo-${Date.now()}`,
          order: 0
        }
      ]
    });
  }
  
  // Save location
  if (url.includes('/location')) {
    return mockResponse({
      success: true,
      message: 'Location saved'
    });
  }
  
  return mockResponse({ error: 'Endpoint not found' }, 404);
};

// Handle PUT requests
const handlePut = async (url, data, config) => {
  console.log('[Mock API] PUT:', url, data);
  
  // Update profile
  if (url.includes('/user-profile')) {
    return mockResponse({
      success: true,
      message: 'Profile updated successfully'
    });
  }
  
  // Mark messages as read
  if (url.includes('/chats/') && url.includes('/read')) {
    return mockResponse({
      success: true,
      message: 'Messages marked as read'
    });
  }
  
  // Mark notification as read
  if (url.includes('/notifications/') && url.includes('/read')) {
    return mockResponse({
      success: true,
      message: 'Notification marked as read'
    });
  }
  
  // Dismiss notification
  if (url.includes('/notifications/') && url.includes('/dismiss')) {
    return mockResponse({
      success: true,
      message: 'Notification dismissed'
    });
  }
  
  return mockResponse({ error: 'Endpoint not found' }, 404);
};

// Handle DELETE requests
const handleDelete = async (url, config) => {
  console.log('[Mock API] DELETE:', url);
  
  // Delete photo
  if (url.includes('/photos/delete')) {
    return mockResponse({
      success: true,
      message: 'Photo deleted successfully'
    });
  }
  
  // Unmatch
  if (url.includes('/likes/unmatch/')) {
    const matchId = url.split('/likes/unmatch/')[1];
    const index = userInteractions.matches.indexOf(matchId);
    if (index > -1) {
      userInteractions.matches.splice(index, 1);
    }
    return mockResponse({
      success: true,
      message: 'Successfully unmatched user'
    });
  }
  
  // Delete chat
  if (url.includes('/chats/') && !url.includes('/messages')) {
    const chatId = url.split('/chats/')[1];
    return mockResponse({
      success: true,
      message: 'Chat deleted successfully'
    });
  }
  
  return mockResponse({ error: 'Endpoint not found' }, 404);
};

// Create and export mock axios instance
export const mockAxios = createMockAxios();

// Replace axios in requestAccessToken
export const setupMockApi = () => {
  // Store original axios if needed
  if (typeof window !== 'undefined') {
    window.mockApiEnabled = true;
  }
  
  return mockAxios;
};

// Mock fetch for direct fetch calls
export const mockFetch = async (url, options = {}) => {
  await delay();
  
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  
  let response;
  
  if (method === 'GET') {
    response = await handleGet(url, options);
  } else if (method === 'POST') {
    response = await handlePost(url, body, options);
  } else if (method === 'PUT') {
    response = await handlePut(url, body, options);
  } else if (method === 'DELETE') {
    response = await handleDelete(url, options);
  }
  
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    json: async () => response.data,
    text: async () => JSON.stringify(response.data),
    headers: new Headers(response.headers)
  };
};

// Setup global fetch override in static mode
export const setupFetchOverride = () => {
  if (typeof window === 'undefined') return;
  
  const isStatic = import.meta.env.VITE_STATIC_MODE === 'true' || import.meta.env.MODE === 'static';
  
  if (isStatic && !window.__mockFetchSetup) {
    window.__mockFetchSetup = true;
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      // Only intercept API calls
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/api/') || urlString.startsWith('/api') || 
          (urlString.includes('api') && !urlString.includes('http'))) {
        return mockFetch(urlString, options);
      }
      // Use original fetch for other requests
      return originalFetch(url, options);
    };
  }
};

// Auto-setup if in browser
if (typeof window !== 'undefined') {
  setupFetchOverride();
}

