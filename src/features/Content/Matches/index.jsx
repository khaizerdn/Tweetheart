import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Card from '../../../components/Card';
import Header from '../../../components/Header';
import MobileMenu from '../../../components/MobileMenu';
import ModalAlertDialog from '../../../components/Modals/ModalAlertDialog';
import { unmatchUser } from './server';
import styles from './styles.module.css';
import MenuButton from '../../Menu/components/button';
import PreparationChatView from '../Chats/components/PreparationChatView';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'with_chat', 'without_chat'
  const [showPreparationChat, setShowPreparationChat] = useState(false);
  const [preparationChatData, setPreparationChatData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [unmatchTarget, setUnmatchTarget] = useState(null);
  const [isUnmatching, setIsUnmatching] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const openFromNavigationHandledRef = useRef(false);

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
      
      // Update the match to show it has a chat when a real chat is created
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

  useEffect(() => {
    // If navigated here with a request to open a preparation chat for a match,
    // invoke the same handler used by clicking a card in Matches
    if (!loading && !openFromNavigationHandledRef.current) {
      const requestedMatchId = location.state && location.state.openPreparationForMatchId;
      if (requestedMatchId) {
        const exists = matches.some(m => m.id === requestedMatchId);
        if (exists) {
          openFromNavigationHandledRef.current = true;
          handleCardClick(requestedMatchId);
          // Clear the navigation state so it doesn't re-trigger on back/forward
          navigate('.', { replace: true, state: null });
        }
      }
    }
  }, [loading, matches, location.state, navigate]);

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
    
    // Show preparation chat in full screen for new matches
    setPreparationChatData({
      matchId: matchId,
      match: match,
      tempChatId: `${userId}_${matchId}`
    });
    setShowPreparationChat(true);
    setMessages([]); // Clear any existing messages
    setNewMessage(''); // Clear input
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle back button click for preparation chat
  const handleBackClick = () => {
    setShowPreparationChat(false);
    setPreparationChatData(null);
    setMessages([]);
    setNewMessage('');
  };

  // Handle sending message in preparation chat
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !preparationChatData) return;

    const userId = document.cookie
      .split('; ')
      .find(row => row.startsWith('userId='))
      ?.split('=')[1];

    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    // Create temporary message for immediate display
    const tempMessage = {
      id: `temp_${Date.now()}`,
      content: newMessage.trim(),
      sender_id: userId,
      is_own: true,
      created_at: new Date().toISOString(),
      is_temporary: true
    };

    // Add temporary message to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      // Send message to server
      const response = await fetch(`http://localhost:8081/api/chats/${preparationChatData.tempChatId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: tempMessage.content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(`Failed to send message: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      // If a real chat was created, navigate to it
      if (data.is_new_chat && data.chat_id !== preparationChatData.tempChatId) {
        // Real chat was created, navigate to it
        navigate(`/chats/${data.chat_id}`);
        return;
      }

      // If still preparation chat, update the message with real data
      if (data.message_id) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { 
                  id: data.message_id,
                  content: tempMessage.content,
                  sender_id: data.sender_id,
                  created_at: new Date().toISOString(),
                  is_own: true
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(tempMessage.content); // Restore message to input
    }
  };

  // Handle Enter key press in message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle unmatch button click
  const handleUnmatchClick = (matchId, event) => {
    event.stopPropagation(); // Prevent card click
    const match = matches.find(m => m.id === matchId);
    setUnmatchTarget(match);
    setShowUnmatchModal(true);
  };

  // Handle view profile button click
  const handleViewProfileClick = (matchId, event) => {
    event.stopPropagation(); // Prevent card click
    navigate(`/profile/${matchId}`);
  };

  // Handle unmatch confirmation
  const handleUnmatchConfirm = async () => {
    if (!unmatchTarget || isUnmatching) return;

    try {
      setIsUnmatching(true);
      
      // Call the unmatch API
      await unmatchUser(unmatchTarget.id);
      
      // Remove the match from the local state
      setMatches(prev => prev.filter(match => match.id !== unmatchTarget.id));
      setFilteredMatches(prev => prev.filter(match => match.id !== unmatchTarget.id));
      
      // Close the modal
      setShowUnmatchModal(false);
      setUnmatchTarget(null);
      
    } catch (error) {
      console.error('Error unmatching user:', error);
      // You could add a toast notification here for better UX
    } finally {
      setIsUnmatching(false);
    }
  };

  // Handle unmatch cancellation
  const handleUnmatchCancel = () => {
    setShowUnmatchModal(false);
    setUnmatchTarget(null);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection for preparation chat
  useEffect(() => {
    if (showPreparationChat && preparationChatData) {
      const newSocket = io('http://localhost:8081', {
        withCredentials: true,
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server for preparation chat');
        setIsConnected(true);
        
        // Get current user ID
        const userId = document.cookie
          .split('; ')
          .find(row => row.startsWith('userId='))
          ?.split('=')[1];
        
        // Join the specific chat room with user context
        newSocket.emit('join_chat', {
          chatId: preparationChatData.tempChatId,
          userId: userId
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      newSocket.on('new_message', (message) => {
        // Get current user ID to determine if this is their own message
        const userId = document.cookie
          .split('; ')
          .find(row => row.startsWith('userId='))
          ?.split('=')[1];
        
        const messageWithOwnFlag = {
          ...message,
          is_own: message.sender_id === userId
        };
        
        setMessages(prev => {
          // If this is our own message, replace any temporary message with the same content
          if (message.sender_id === userId) {
            const filteredMessages = prev.filter(msg => 
              !(msg.id && typeof msg.id === 'string' && msg.id.startsWith('temp_') && msg.content === message.content)
            );
            return [...filteredMessages, messageWithOwnFlag];
          } else {
            // For other users' messages, just add them
            return [...prev, messageWithOwnFlag];
          }
        });
      });

      newSocket.on('new_chat_created', (data) => {
        console.log('Real chat created:', data);
        // Navigate to the real chat
        navigate(`/chats/${data.id}`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [showPreparationChat, preparationChatData, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className={styles.matches}>
        <Header title="Matches" className={styles.matchesHeader} />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <i className="fa fa-spinner fa-spin"></i>
            <h3>Loading matches...</h3>
            <p>Finding your connections</p>
          </div>
        </div>
        <MobileMenu />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.matches}>
        <Header title="Matches" className={styles.matchesHeader} />
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
        <MobileMenu />
      </div>
    );
  }

  // Show preparation chat in full screen
  if (showPreparationChat && preparationChatData) {
    const match = preparationChatData.match;
    const firstName = match?.name ? match.name.split(' ')[0] : '';

    const handleViewProfile = () => {
      navigate(`/profile/${match.id}`);
    };

    const handleUnmatch = () => {
      setUnmatchTarget(match);
      setShowUnmatchModal(true);
    };

    const rightPanel = (
      <aside className={styles.userInfoPanel}>
        <div className={styles.userInfoPhotoWrap}>
          {match?.photos?.length > 0 ? (
            <img
              src={match.photos[0]}
              alt="User Photo"
              className={styles.userPhoto}
            />
          ) : (
            <div className={styles.userPhotoPlaceholder}>
              <i className="fa fa-user" />
            </div>
          )}
        </div>
        <div className={styles.userInfoName}>
          {firstName}
        </div>
        <div className={styles.userActionButtonsCol}>
          <MenuButton
            to={"/profile/" + match.id}
            iconClass="fa fa-user"
            label="View Profile"
            onClick={handleViewProfile}
          />
          <MenuButton
            to="#unmatch"
            iconClass="fa fa-ban"
            label="Unmatch"
            onClick={handleUnmatch}
          />
        </div>
      </aside>
    );

    return (
      <PreparationChatView
        title={match?.name?.split(' ')[0] || 'New Chat'}
        userPhotoUrl={match?.photos?.[0]}
        onBack={handleBackClick}
        isConnected={isConnected}
        messages={messages}
        messagesEndRef={messagesEndRef}
        newMessage={newMessage}
        onChangeMessage={(e) => setNewMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        onSend={handleSendMessage}
        inputRef={inputRef}
        rightPanel={rightPanel}
        emptyText={'Send your first message to start the conversation!'}
        onViewProfile={match?.id ? handleViewProfile : undefined}
        onUnmatch={match?.id ? handleUnmatch : undefined}
      />
    );
  }

  return (
    <div className={styles.matches}>
      <Header title="Matches" className={styles.matchesHeader} />
      
      {/* Filter button - always visible */}
      <button 
        className={styles.filterButton}
        onClick={() => setShowFilter(!showFilter)}
        title="Filter matches"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6L15 12v6a1 1 0 0 1-1.447.894l-4-2A1 1 0 0 1 9 16v-4L3.2 5.6A1 1 0 0 1 3 5z"/>
        </svg>
      </button>
      
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
            <i className="fa fa-comments"></i>
            <div className={styles.filterOptionContent}>
              <span>Without Chats</span>
              <span className={styles.filterCount}>({withoutChatCount})</span>
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
                 viewProfileButton={
                   <button
                     className={styles.viewProfileButton}
                     onClick={(e) => handleViewProfileClick(match.id, e)}
                     title="View Profile"
                   >
                     View Profile
                   </button>
                 }
                 unmatchButton={
                   <button
                     className={styles.unmatchButton}
                     onClick={(e) => handleUnmatchClick(match.id, e)}
                     title="Unmatch"
                     disabled={isUnmatching}
                   >
                     Unmatch
                   </button>
                 }
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
      
      {/* Unmatch Confirmation Modal */}
      <ModalAlertDialog
        isOpen={showUnmatchModal}
        title="Unmatch User"
        message={`Are you sure you want to unmatch with ${unmatchTarget?.name}? This will delete your chat history and you won't be able to message them again.`}
        confirmText={isUnmatching ? "Unmatching..." : "Unmatch"}
        cancelText="Cancel"
        onConfirm={handleUnmatchConfirm}
        onCancel={handleUnmatchCancel}
        type="confirm"
      />
      
      <MobileMenu />
    </div>
  );
};

export default Matches;
