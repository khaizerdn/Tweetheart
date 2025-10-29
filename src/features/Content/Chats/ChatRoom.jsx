import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import styles from './styles.module.css';
import { fetchChatMessages, sendChatMessage, markMessagesAsRead, createChat } from './server';

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      
      setMessages(prev => [...prev, messageWithOwnFlag]);
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
        
        // Check if this is a new chat (format: userId1_userId2)
        if (chatId.includes('_') && !chatId.startsWith('chat_')) {
          // This is a new chat, extract the other user ID
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
        } else {
          // This is an existing chat
          const data = await fetchChatMessages(chatId);
          setMessages(data.messages || []);
          setChatExists(true);
          
          // Mark messages as read
          await markMessagesAsRead(chatId);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
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

      // If this is a new chat, create it first
      if (!chatExists && otherUserId) {
        try {
          const chatResponse = await createChat(otherUserId);
          actualChatId = chatResponse.chat.id;
          setChatExists(true);
          
          // Update the URL to reflect the new chat ID
          window.history.replaceState(null, '', `/chats/${actualChatId}`);
        } catch (createErr) {
          console.error('Error creating chat:', createErr);
          throw new Error('Failed to create chat. Please try again.');
        }
      }

      // Send message via socket
      socket.emit('send_message', {
        chatId: actualChatId,
        message: messageText,
        senderId: userId
      });
      
      // Also save to database via API
      await sendChatMessage(actualChatId, messageText);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      // Restore the message to input
      setNewMessage(messageText);
    }
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
            onClick={() => navigate('/chats')}
          >
            <i className="fa fa-arrow-left"></i>
          </button>
          <h2>Loading...</h2>
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
            onClick={() => navigate('/chats')}
          >
            <i className="fa fa-arrow-left"></i>
          </button>
          <h2>Error</h2>
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

  return (
    <div className={styles.chatRoom}>
      <div className={styles.chatHeader}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/chats')}
        >
          <i className="fa fa-arrow-left"></i>
        </button>
        <h2>Chat</h2>
        <div className={styles.connectionStatus}>
          {isConnected ? (
            <i className="fa fa-circle" style={{ color: '#4CAF50' }}></i>
          ) : (
            <i className="fa fa-circle" style={{ color: '#f44336' }}></i>
          )}
        </div>
      </div>
      
      <div className={styles.chatContainer}>
        <div className={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div className={styles.emptyMessages}>
              <i className="fa fa-comments"></i>
              <p>{chatExists ? 'No messages yet. Start the conversation!' : 'Send your first message to start the conversation!'}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${message.is_own ? styles.ownMessage : styles.otherMessage}`}
              >
                <div className={styles.messageContent}>
                  <p>{message.content}</p>
                  <span className={styles.messageTime}>
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className={styles.messageInput} onSubmit={handleSendMessage}>
          <div className={styles.inputContainer}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className={styles.textInput}
              disabled={!isConnected}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!newMessage.trim() || !isConnected}
            >
              <i className="fa fa-paper-plane"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
