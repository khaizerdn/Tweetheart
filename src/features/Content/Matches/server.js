// Fetch all matches for the current user
export const fetchMatches = async () => {
  try {
    const response = await fetch('http://localhost:8081/api/likes/matches', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
};

// Fetch a specific match by ID
export const fetchMatchById = async (matchId) => {
  try {
    const response = await fetch(`http://localhost:8081/api/matches/${matchId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch match: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching match:', error);
    throw error;
  }
};

// Send a message to a match
export const sendMessage = async (matchId, message) => {
  try {
    const response = await fetch(`http://localhost:8081/api/matches/${matchId}/messages`, {
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

// Fetch messages for a specific match
export const fetchMessages = async (matchId) => {
  try {
    const response = await fetch(`http://localhost:8081/api/matches/${matchId}/messages`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Unmatch with a user
export const unmatchUser = async (matchId) => {
  try {
    const response = await fetch(`http://localhost:8081/api/likes/unmatch/${matchId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to unmatch user: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error unmatching user:', error);
    throw error;
  }
};

// Report a match
export const reportMatch = async (matchId, reason) => {
  try {
    const response = await fetch(`http://localhost:8081/api/matches/${matchId}/report`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error(`Failed to report match: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error reporting match:', error);
    throw error;
  }
};
