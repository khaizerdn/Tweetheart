import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import styles from './styles.module.css';
import PreparationChatView from './components/PreparationChatView';
import matchesStyles from '../Matches/styles.module.css';
import { fetchChats, fetchChatMessages, sendChatMessage, markMessagesAsRead } from './server';
import { fetchMatchById, unmatchUser } from '../Matches/server';
import MenuButton from '../../Menu/components/button';

const ChatRoom = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatExists, setChatExists] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [isPreparationChat, setIsPreparationChat] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if this is a preparation chat (temporary chat ID format: userId1_userId2)
  const checkIfPreparationChat = () => {
    // Preparation chats have format: userId1_userId2 (contains underscore and no 'chat_' prefix)
    const isPrep = chatId.includes('_') && !chatId.startsWith('chat_');
    setIsPreparationChat(isPrep);
    return isPrep;
  };

  // Handle back button click
  const handleBackClick = () => {
    if (isPreparationChat) {
      // For preparation chats, go back to matches page
      navigate('/matches');
    } else {
      // For real chats, go to chats list
      navigate('/chats');
    }
  };

  // Check if this is a preparation chat when component mounts
  useEffect(() => {
    checkIfPreparationChat();
  }, [chatId]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:8081', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      // Get current user ID
      const userId = document.cookie
        .split('; ')
        .find(row => row.startsWith('userId='))
        ?.split('=')[1];
      
      // Join the specific chat room with user context
      newSocket.emit('join_chat', {
        chatId: chatId,
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
      scrollToBottom();
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError('Connection error. Please refresh the page.');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [chatId]);

  // Fetch messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Check if this is a temporary chat (format: userId1_userId2)
        if (chatId.includes('_') && !chatId.startsWith('chat_')) {
          // This is a temporary chat with user IDs
          const userId = document.cookie
            .split('; ')
            .find(row => row.startsWith('userId='))
            ?.split('=')[1];
          
          if (userId) {
            const userIds = chatId.split('_');
            const otherId = userIds.find(id => id !== userId);
            setOtherUserId(otherId);
            setChatExists(false);
            setMessages([]);
          }
        } else if (chatId.startsWith('chat_')) {
          // This is an existing chat
          try {
            const data = await fetchChatMessages(chatId);
            setMessages(data.messages || []);
            setChatExists(true);
            
            // Mark messages as read if there are any
            if (data.messages && data.messages.length > 0) {
              await markMessagesAsRead(chatId);
            }
          } catch (err) {
            if (err.message.includes('Access denied')) {
              throw err;
            }
            setMessages([]);
            setChatExists(true);
          }
        } else {
          // This is a legacy format (userId1_userId2), extract other user ID
          const userId = document.cookie
            .split('; ')
            .find(row => row.startsWith('userId='))
            ?.split('=')[1];
          
          if (userId) {
            const userIds = chatId.split('_');
            const otherId = userIds.find(id => id !== userId);
            setOtherUserId(otherId);
            setChatExists(false);
            setMessages([]);
          }
        }
        
      } catch (err) {
        console.error('Error fetching messages:', err);
        if (err.message.includes('Access denied')) {
          setError('You do not have access to this chat.');
        } else {
          setError('Failed to load messages. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  // Fetch other user profile info for right panel
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (isPreparationChat && otherUserId) {
          const data = await fetchMatchById(otherUserId);
          const match = data.match || data;
          const photos = match?.photos ? (Array.isArray(match.photos) ? match.photos : []) : [];
          setOtherUserProfile({
            id: match?.id,
            firstName: (match?.name || `${match?.first_name || ''} ${match?.last_name || ''}`).trim().split(' ')[0],
            photo: photos[0] && (photos[0].url || photos[0])
          });
          return;
        }

        if (!isPreparationChat && chatId && chatId.startsWith('chat_')) {
          const chatsData = await fetchChats();
          const chat = (chatsData.chats || []).find(c => c.id === chatId);
          if (chat && chat.other_user) {
            const photos = chat.other_user.photos ? chat.other_user.photos.map(p => p.url || p) : [];
            setOtherUserId(chat.other_user.id);
            setOtherUserProfile({
              id: chat.other_user.id,
              firstName: (chat.other_user.name || '').split(' ')[0],
              photo: photos[0] || null
            });
          }
        }
      } catch (e) {
        console.error('Failed to load other user profile:', e);
      }
    };

    loadProfile();
  }, [isPreparationChat, otherUserId, chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Handle sending a message
  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Get current user ID from cookies
      const userId = document.cookie
        .split('; ')
        .find(row => row.startsWith('userId='))
        ?.split('=')[1];

      if (!userId) {
        throw new Error('User not authenticated');
      }

      let actualChatId = chatId;

      // If this is a temporary chat, we'll create it when sending the message
      if (chatId.includes('_') && !chatId.startsWith('chat_')) {
        // This is a temporary chat with user IDs, we'll create it in the database when sending the message
        actualChatId = chatId;
        setChatExists(true);
      }

      // Add message to local state immediately for instant UI update
      const tempMessage = {
        id: `temp_${Date.now()}`,
        content: messageText,
        sender_id: userId,
        created_at: new Date().toISOString(),
        is_own: true
      };
      setMessages(prev => [...prev, tempMessage]);

      // Send message via socket
      socket.emit('send_message', {
        chatId: actualChatId,
        message: messageText,
        senderId: userId
      });
      
      // Also save to database via API
      const response = await sendChatMessage(actualChatId, messageText);
      
      // If this was a new chat, update the URL with the real chat ID
      if (response.is_new_chat && response.chat_id) {
        // Update the URL to reflect the new chat ID
        navigate(`/chats/${response.chat_id}`, { replace: true });
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      // Restore the message to input
      setNewMessage(messageText);
    }
  };

  const handleSendClick = () => {
    handleSendMessage();
  };

  // Handle key press in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className={styles.chatRoom}>
        <div className={styles.chatHeader}>
          <button 
            className={styles.backButton}
            onClick={handleBackClick}
          >
            <i className="fa fa-arrow-left"></i>
          </button>
          <h2>{isPreparationChat ? 'New Chat' : 'Loading...'}</h2>
        </div>
        <div className={styles.chatContainer}>
          <div className={styles.loadingState}>
            <i className="fa fa-spinner fa-spin"></i>
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.chatRoom}>
        <div className={styles.chatHeader}>
          <button 
            className={styles.backButton}
            onClick={handleBackClick}
          >
            <i className="fa fa-arrow-left"></i>
          </button>
          <h2>{isPreparationChat ? 'New Chat' : 'Error'}</h2>
        </div>
        <div className={styles.chatContainer}>
          <div className={styles.errorState}>
            <i className="fa fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className={styles.retryButton}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rightPanel = (
    <aside className={matchesStyles.userInfoPanel}>
      <div className={matchesStyles.userInfoPhotoWrap}>
        {otherUserProfile?.photo ? (
          <img src={otherUserProfile.photo} alt="User Photo" className={matchesStyles.userPhoto} />
        ) : (
          <div className={matchesStyles.userPhotoPlaceholder}>
            <i className="fa fa-user" />
          </div>
        )}
      </div>
      <div className={matchesStyles.userInfoName}>
        {otherUserProfile?.firstName || (isPreparationChat ? 'New Chat' : 'Chat')}
      </div>
      {otherUserId && (
        <div className={matchesStyles.userActionButtonsCol}>
          <MenuButton
            to={"/profile/" + otherUserId}
            iconClass="fa fa-user"
            label="View Profile"
            onClick={() => navigate(`/profile/${otherUserId}`)}
          />
          <MenuButton
            to="#unmatch"
            iconClass="fa fa-ban"
            label="Unmatch"
            onClick={async () => {
              try {
                await unmatchUser(otherUserId);
                navigate('/chats');
              } catch (e) {
                console.error('Unmatch failed:', e);
              }
            }}
          />
        </div>
      )}
    </aside>
  );

  return (
    <PreparationChatView
      title={otherUserProfile?.firstName || (isPreparationChat ? 'New Chat' : 'Chat')}
      userPhotoUrl={otherUserProfile?.photo || null}
      onBack={handleBackClick}
      isConnected={isConnected}
      messages={messages}
      messagesEndRef={messagesEndRef}
      renderMessageTime={formatMessageTime}
      newMessage={newMessage}
      onChangeMessage={(e) => setNewMessage(e.target.value)}
      onKeyPress={handleKeyPress}
      onSend={handleSendClick}
      inputRef={inputRef}
      rightPanel={rightPanel}
      emptyText={isPreparationChat ? 'Send your first message to start the conversation!' : (chatExists ? 'No messages yet. Start the conversation!' : 'Send your first message to start the conversation!')}
    />
  );
};

export default ChatRoom;
