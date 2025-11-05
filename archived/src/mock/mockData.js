// Mock data for static site demo
// This data simulates a fully functional dating app experience

// Current user (logged in user)
export const currentUser = {
  id: 'user-1',
  email: 'demo@tweetheart.com',
  first_name: 'Alex',
  last_name: 'Johnson',
  bio: 'Love hiking, photography, and good coffee! Always up for an adventure. Looking for someone who shares my passion for travel and exploring new places.',
  birthdate: '1995-06-15',
  gender: 'male', // Added gender field
  age: 29,
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    state: 'NY'
  },
  photos: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop'
  ], // Reduced to 2 photos minimum as required
  preferences: {
    minAge: 25,
    maxAge: 35,
    maxDistance: 50
  }
};

// Mock users for the feed
export const mockUsers = [
  {
    id: 'user-2',
    first_name: 'Sarah',
    last_name: 'Williams',
    bio: 'Artist and traveler. Love painting landscapes and trying new cuisines. Looking for someone creative and adventurous!',
    birthdate: '1993-08-22',
    age: 31,
    gender: 'female',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7589,
      longitude: -73.9851,
      city: 'New York',
      state: 'NY',
      distance: 3.2
    }
  },
  {
    id: 'user-3',
    first_name: 'Michael',
    last_name: 'Chen',
    bio: 'Software engineer by day, foodie by night. Love cooking and trying new restaurants. Always up for a good conversation!',
    birthdate: '1997-03-10',
    age: 27,
    gender: 'male',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7282,
      longitude: -73.9942,
      city: 'New York',
      state: 'NY',
      distance: 1.8
    }
  },
  {
    id: 'user-4',
    first_name: 'Emma',
    last_name: 'Davis',
    bio: 'Yoga instructor and wellness enthusiast. Love meditation, reading, and spending time in nature. Looking for someone who values mindfulness.',
    birthdate: '1994-11-05',
    age: 30,
    gender: 'female',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7614,
      longitude: -73.9776,
      city: 'New York',
      state: 'NY',
      distance: 2.5
    }
  },
  {
    id: 'user-5',
    first_name: 'David',
    last_name: 'Martinez',
    bio: 'Musician and coffee enthusiast. Play guitar and love live music. Looking for someone who appreciates good vibes and great conversations.',
    birthdate: '1996-07-18',
    age: 28,
    gender: 'male',
    photos: [
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7489,
      longitude: -73.9680,
      city: 'New York',
      state: 'NY',
      distance: 4.1
    }
  },
  {
    id: 'user-6',
    first_name: 'Olivia',
    last_name: 'Brown',
    bio: 'Fitness coach and nutritionist. Love helping people achieve their goals. Looking for someone motivated and positive!',
    birthdate: '1992-04-25',
    age: 32,
    gender: 'female',
    photos: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7580,
      longitude: -73.9855,
      city: 'New York',
      state: 'NY',
      distance: 2.9
    }
  },
  {
    id: 'user-7',
    first_name: 'James',
    last_name: 'Wilson',
    bio: 'Writer and book lover. Published a few short stories. Love quiet cafes and deep conversations. Looking for someone intellectually curious.',
    birthdate: '1991-12-30',
    age: 33,
    gender: 'male',
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7282,
      longitude: -73.9942,
      city: 'New York',
      state: 'NY',
      distance: 1.8
    }
  },
  {
    id: 'user-8',
    first_name: 'Sophia',
    last_name: 'Garcia',
    bio: 'Photographer and nature enthusiast. Love capturing moments and exploring national parks. Looking for an adventure partner!',
    birthdate: '1995-09-12',
    age: 29,
    gender: 'female',
    photos: [
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7614,
      longitude: -73.9776,
      city: 'New York',
      state: 'NY',
      distance: 2.5
    }
  },
  {
    id: 'user-9',
    first_name: 'Ryan',
    last_name: 'Taylor',
    bio: 'Entrepreneur and fitness enthusiast. Love building things and staying active. Looking for someone ambitious and fun!',
    birthdate: '1994-01-20',
    age: 30,
    gender: 'male',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7489,
      longitude: -73.9680,
      city: 'New York',
      state: 'NY',
      distance: 4.1
    }
  },
  {
    id: 'user-10',
    first_name: 'Isabella',
    last_name: 'Anderson',
    bio: 'Chef and food blogger. Love creating new recipes and sharing them with friends. Looking for someone who appreciates good food!',
    birthdate: '1993-06-08',
    age: 31,
    gender: 'female',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop'
    ],
    location: {
      latitude: 40.7589,
      longitude: -73.9851,
      city: 'New York',
      state: 'NY',
      distance: 3.2
    }
  }
];

// Mock matches (mutual likes)
export const mockMatches = [
  {
    id: 'user-2',
    first_name: 'Sarah',
    last_name: 'Williams',
    bio: 'Artist and traveler. Love painting landscapes and trying new cuisines. Looking for someone creative and adventurous!',
    age: 31,
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop'
    ],
    matched_at: '2024-10-15T10:30:00Z',
    chat_id: 'chat-1',
    has_chat: true
  },
  {
    id: 'user-4',
    first_name: 'Emma',
    last_name: 'Davis',
    bio: 'Yoga instructor and wellness enthusiast. Love meditation, reading, and spending time in nature.',
    age: 30,
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop'
    ],
    matched_at: '2024-10-20T14:15:00Z',
    chat_id: 'chat-2',
    has_chat: true
  },
  {
    id: 'user-6',
    first_name: 'Olivia',
    last_name: 'Brown',
    bio: 'Fitness coach and nutritionist. Love helping people achieve their goals.',
    age: 32,
    photos: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop'
    ],
    matched_at: '2024-10-25T09:45:00Z',
    chat_id: null,
    has_chat: false
  }
];

// Mock chats
export const mockChats = [
  {
    id: 'chat-1',
    match_id: 'user-2',
    match_name: 'Sarah Williams',
    match_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
    last_message: "Hey! I saw your photos, they're amazing! Would love to chat more.",
    last_message_time: '2024-11-05T10:30:00Z',
    unread_count: 2,
    is_read: false
  },
  {
    id: 'chat-2',
    match_id: 'user-4',
    match_name: 'Emma Davis',
    match_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    last_message: 'Thanks for the match! How are you doing today?',
    last_message_time: '2024-11-04T16:20:00Z',
    unread_count: 0,
    is_read: true
  }
];

// Mock messages for chat-1
export const mockMessagesChat1 = [
  {
    id: 'msg-1',
    chat_id: 'chat-1',
    sender_id: 'user-2',
    sender_name: 'Sarah',
    message: "Hey! I saw your photos, they're amazing! Would love to chat more.",
    created_at: '2024-11-05T10:30:00Z',
    is_read: false
  },
  {
    id: 'msg-2',
    chat_id: 'chat-1',
    sender_id: 'user-1',
    sender_name: 'Alex',
    message: "Thank you! Your paintings look incredible. I'd love to see more of your work!",
    created_at: '2024-11-05T10:35:00Z',
    is_read: true
  },
  {
    id: 'msg-3',
    chat_id: 'chat-1',
    sender_id: 'user-2',
    sender_name: 'Sarah',
    message: 'That means a lot! Are you into art as well?',
    created_at: '2024-11-05T10:40:00Z',
    is_read: false
  }
];

// Mock messages for chat-2
export const mockMessagesChat2 = [
  {
    id: 'msg-4',
    chat_id: 'chat-2',
    sender_id: 'user-4',
    sender_name: 'Emma',
    message: 'Thanks for the match! How are you doing today?',
    created_at: '2024-11-04T16:20:00Z',
    is_read: true
  },
  {
    id: 'msg-5',
    chat_id: 'chat-2',
    sender_id: 'user-1',
    sender_name: 'Alex',
    message: "I'm doing great! Thanks for reaching out. I noticed you're into yoga - that's awesome!",
    created_at: '2024-11-04T16:25:00Z',
    is_read: true
  },
  {
    id: 'msg-6',
    chat_id: 'chat-2',
    sender_id: 'user-4',
    sender_name: 'Emma',
    message: 'Yes! It keeps me centered. Do you practice any mindfulness activities?',
    created_at: '2024-11-04T16:30:00Z',
    is_read: true
  }
];

// Mock notifications - only match notifications (no 'like' or 'message' types)
let mockNotifications = [
  {
    id: 'notif-1',
    type: 'match',
    title: 'New Match!',
    message: 'You and Sarah Williams liked each other!',
    data: JSON.stringify({ matchUserId: 'user-2', matchUserName: 'Sarah Williams' }),
    is_read: false,
    is_dismissed: false,
    created_at: '2024-10-15T10:30:00Z'
  },
  {
    id: 'notif-3',
    type: 'match',
    title: 'New Match!',
    message: 'You and Emma Davis liked each other!',
    data: JSON.stringify({ matchUserId: 'user-4', matchUserName: 'Emma Davis' }),
    is_read: true,
    is_dismissed: false,
    created_at: '2024-10-20T14:15:00Z'
  }
];

// Function to add a new notification
export const addNotification = (notification) => {
  mockNotifications.unshift(notification); // Add to beginning
  
  // Dispatch custom event for static mode to trigger popup
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mock_notification', {
      detail: notification
    }));
  }
  
  return notification;
};

// Export getter for notifications
export const getNotifications = () => mockNotifications;

// Store for managing state (likes, passes, etc.)
let userInteractions = {
  liked: ['user-2', 'user-4', 'user-6'],
  passed: ['user-3'],
  matches: ['user-2', 'user-4', 'user-6']
};

// Helper to get user by ID
export const getUserById = (userId) => {
  if (userId === currentUser.id) return currentUser;
  return mockUsers.find(u => u.id === userId) || mockMatches.find(m => m.id === userId);
};

// Helper to get messages for a chat
export const getMessagesForChat = (chatId) => {
  if (chatId === 'chat-1') return mockMessagesChat1;
  if (chatId === 'chat-2') return mockMessagesChat2;
  return [];
};

// Helper to check if users matched
export const isMatch = (userId) => {
  return userInteractions.matches.includes(userId);
};

// Helper to record like/pass
export const recordInteraction = (userId, type) => {
  if (type === 'like') {
    if (!userInteractions.liked.includes(userId)) {
      userInteractions.liked.push(userId);
    }
    
    // Check if it's a match (simulate: if user is user-2, user-4, or user-6, they're already matches)
    // For demo purposes, we'll create a match notification for any like
    const user = getUserById(userId);
    if (user) {
      const userName = `${user.first_name} ${user.last_name}`;
      
      // Create a match notification (simulating a match for demo)
      // In a real app, this would only happen if both users liked each other
      const isMatch = userInteractions.matches.includes(userId) || 
                      ['user-2', 'user-4', 'user-6'].includes(userId); // Pre-defined matches
      
      if (isMatch && !userInteractions.matches.includes(userId)) {
        userInteractions.matches.push(userId);
      }
      
      // Create notification for all likes - always as 'match' type for demo purposes
      const notification = {
        id: `notif-${Date.now()}`,
        type: 'match', // Always create as match type for demo
        title: 'New Match!',
        message: `You and ${userName} liked each other!`,
        data: JSON.stringify({ matchUserId: userId, matchUserName: userName }),
        is_read: false,
        is_dismissed: false,
        created_at: new Date().toISOString()
      };
      
      // Always trigger popup for likes (via event)
      addNotification(notification);
      
      return { success: true, isMatch: isMatch };
    }
    
    return { success: true, isMatch: false };
  } else if (type === 'pass') {
    if (!userInteractions.passed.includes(userId)) {
      userInteractions.passed.push(userId);
    }
    return { success: true, isMatch: false };
  }
};

// Helper to get feed users (excluding liked/passed)
export const getFeedUsers = (page = 1, limit = 10, filters = {}) => {
  const excluded = [...userInteractions.liked, ...userInteractions.passed];
  let filtered = mockUsers.filter(u => !excluded.includes(u.id));
  
  // Apply age filters
  if (filters.minAge) {
    filtered = filtered.filter(u => u.age >= filters.minAge);
  }
  if (filters.maxAge) {
    filtered = filtered.filter(u => u.age <= filters.maxAge);
  }
  
  // Apply distance filter
  if (filters.distance) {
    filtered = filtered.filter(u => u.location.distance <= filters.distance);
  }
  
  // Pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    users: filtered.slice(start, end),
    total: filtered.length,
    page,
    hasMore: end < filtered.length
  };
};

export { userInteractions };

