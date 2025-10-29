import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Card from '../../../components/Card';
import styles from './styles.module.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'with_chat', 'without_chat'
  const navigate = useNavigate();

  // Fetch matches data
  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError("");
      
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

      const data = await response.json();
      const { matches: matchesData } = data;
      
      // Transform the data to match the expected format
      const transformedMatches = matchesData.map(match => ({
        id: match.id,
        name: `${match.first_name} ${match.last_name}`.trim(),
        age: match.age || null,
        bio: match.bio || null,
        gender: match.gender || null,
        photos: match.photos || [],
        lastMessage: match.lastMessage || null,
        matchedAt: match.matched_at,
        chatId: match.chat_id,
        hasChat: match.has_chat || false
      }));
      
      setMatches(transformedMatches);
      setFilteredMatches(transformedMatches);
      
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("Failed to load matches. Please try again.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize socket connection for real-time updates
  useEffect(() => {
    const newSocket = io('http://localhost:8081', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to matches server');
      
      // Get current user ID
      const userId = document.cookie
        .split('; ')
        .find(row => row.startsWith('userId='))
        ?.split('=')[1];
      
      if (userId) {
        // Join user's personal room for match updates
        newSocket.emit('join_user_room', { userId });
      }
    });

    newSocket.on('match_removed', (data) => {
      console.log('Match removed event received:', data);
      const { matchId } = data;
      
      // Update the match to show it has a chat instead of removing it
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, hasChat: true, chatId: data.chatId || true }
          : match
      ));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from matches server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Filter matches based on filter type
  const filterMatches = (matches, filterType) => {
    switch (filterType) {
      case 'with_chat':
        return matches.filter(match => match.hasChat);
      case 'without_chat':
        return matches.filter(match => !match.hasChat);
      case 'all':
      default:
        return matches;
    }
  };

  // Get counts for each filter type
  const getFilterCounts = () => {
    const allCount = matches.length;
    const withChatCount = matches.filter(match => match.hasChat).length;
    const withoutChatCount = matches.filter(match => !match.hasChat).length;
    
    return { allCount, withChatCount, withoutChatCount };
  };

  const { allCount, withChatCount, withoutChatCount } = getFilterCounts();

  // Apply filter when filterType changes
  useEffect(() => {
    const filtered = filterMatches(matches, filterType);
    setFilteredMatches(filtered);
  }, [matches, filterType]);

  // Fetch matches on component mount
  useEffect(() => {
    fetchMatches();
  }, []);

  // Handle card click to start chat
  const handleCardClick = async (matchId) => {
    // Get current user ID
    const userId = document.cookie
      .split('; ')
      .find(row => row.startsWith('userId='))
      ?.split('=')[1];
    
    if (!userId) {
      console.error('User not authenticated');
      return;
    }
    
    // Check if this match already has a chat
    const match = matches.find(m => m.id === matchId);
    if (match && match.hasChat && match.chatId) {
      // Navigate to existing chat
      navigate(`/chats/${match.chatId}`);
      return;
    }
    
    try {
      // Create new chat
      const response = await fetch('http://localhost:8081/api/chats', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId })
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json();
      const chatId = data.chat.id;
      
      // Update the match to show it has a chat (no removal)
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, hasChat: true, chatId: chatId }
          : match
      ));
      
      // Navigate to the chat
      navigate(`/chats/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      // Fallback to old method if API fails
      const chatRoomId = [userId, matchId].sort().join('_');
      navigate(`/chats/${chatRoomId}`);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.matches}>
        <div className={styles.header}>
          <h1>Matches</h1>
        </div>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <i className="fa fa-spinner fa-spin"></i>
            <h3>Loading matches...</h3>
            <p>Finding your connections</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.matches}>
        <div className={styles.header}>
          <h1>Matches</h1>
        </div>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <i className="fa fa-exclamation-triangle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button 
              onClick={fetchMatches} 
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.matches}>
      <div className={styles.header}>
        <h1>Matches</h1>
        <button 
          className={styles.filterButton}
          onClick={() => setShowFilter(!showFilter)}
          title="Filter matches"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
          </svg>
        </button>
      </div>
      
      {showFilter && (
        <div 
          className={styles.filterBackdrop}
          onClick={() => setShowFilter(false)}
        />
      )}
      
      <div className={`${styles.filterContainer} ${showFilter ? styles.filterContainerOpen : ''}`}>
        <div className={styles.filterHeader}>
          <h3>Filter Matches</h3>
          <button 
            className={styles.closeButton}
            onClick={() => setShowFilter(false)}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
        
        <div className={styles.filterOptions}>
          <button 
            className={`${styles.filterOption} ${filterType === 'all' ? styles.active : ''}`}
            onClick={() => {
              setFilterType('all');
              setShowFilter(false);
            }}
          >
            <i className="fa fa-users"></i>
            <div className={styles.filterOptionContent}>
              <span>All Matches</span>
              <span className={styles.filterCount}>({allCount})</span>
            </div>
          </button>
          <button 
            className={`${styles.filterOption} ${filterType === 'without_chat' ? styles.active : ''}`}
            onClick={() => {
              setFilterType('without_chat');
              setShowFilter(false);
            }}
          >
            <i className="fa fa-heart"></i>
            <div className={styles.filterOptionContent}>
              <span>New Matches</span>
              <span className={styles.filterCount}>({withoutChatCount})</span>
            </div>
          </button>
          <button 
            className={`${styles.filterOption} ${filterType === 'with_chat' ? styles.active : ''}`}
            onClick={() => {
              setFilterType('with_chat');
              setShowFilter(false);
            }}
          >
            <i className="fa fa-comments"></i>
            <div className={styles.filterOptionContent}>
              <span>With Chats</span>
              <span className={styles.filterCount}>({withChatCount})</span>
            </div>
          </button>
        </div>
      </div>
      
      <div className={styles.container}>

        {filteredMatches.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fa fa-heart"></i>
            <h3>No matches found</h3>
            <p>{filterType === 'all' ? 'Keep swiping to find your perfect match!' : 'No matches match your current filter.'}</p>
          </div>
        ) : (
           <div className={styles.grid}>
             {filteredMatches.map((match) => (
               <Card
                 key={match.id}
                 className={styles.matchCard}
                 photos={match.photos}
                 currentPhotoIndex={0}
                 showNavigation={false}
                 showIndicators={false}
                 onClick={() => handleCardClick(match.id)}
               >
                 <div className={styles.nameAge}>
                   <h3>{match.name}, {match.age}</h3>
                   <div className={styles.category}>
                     <i className="fa fa-venus-mars"></i>
                     <span>{match.gender === 'male' ? 'Male' : match.gender === 'female' ? 'Female' : 'Other'}</span>
                     {match.hasChat && (
                       <div className={styles.chatIndicator}>
                         <i className="fa fa-comments"></i>
                         <span>Chat</span>
                       </div>
                     )}
                   </div>
                 </div>
                 
                 {match.bio && (
                   <div className={styles.bioPreview}>
                     {match.bio}
                   </div>
                 )}
               </Card>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
