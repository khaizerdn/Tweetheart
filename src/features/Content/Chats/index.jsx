import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Card from '../../../components/Card';
import styles from './styles.module.css';
import { fetchChats } from './server';

const Chats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  const { chatId } = useParams();

  // Fetch existing chats data
  const fetchChatsData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const data = await fetchChats();
      const { chats: chatsData } = data;
      
      setChats(chatsData);
      
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load chats. Please try again.");
      setChats([]);
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
      console.log('Connected to chat list server');
      
      // Get current user ID
      const userId = document.cookie
        .split('; ')
        .find(row => row.startsWith('userId='))
        ?.split('=')[1];
      
      if (userId) {
        // Join user's personal room for chat list updates
        newSocket.emit('join_user_room', { userId });
      }
    });

    newSocket.on('new_chat_created', (chatData) => {
      console.log('New chat created:', chatData);
      // Add the new chat to the list
      setChats(prev => {
        // Check if chat already exists to avoid duplicates
        const exists = prev.some(chat => chat.id === chatData.id);
        if (!exists) {
          return [chatData, ...prev];
        }
        return prev;
      });
    });

    newSocket.on('chat_activated', (chatData) => {
      console.log('Chat activated:', chatData);
      // Update the chat in the list with new message
      setChats(prev => prev.map(chat => 
        chat.id === chatData.id 
          ? { ...chat, last_message: chatData.last_message }
          : chat
      ));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat list server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch chats on component mount
  useEffect(() => {
    fetchChatsData();
  }, []);

  // Handle card click to open chat room
  const handleCardClick = (chatId) => {
    navigate(`/chats/${chatId}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.chats}>
        <div className={styles.header}>
          <h1>Chats</h1>
        </div>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <i className="fa fa-spinner fa-spin"></i>
            <h3>Loading chats...</h3>
            <p>Finding your conversations</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.chats}>
        <div className={styles.header}>
          <h1>Chats</h1>
        </div>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <i className="fa fa-exclamation-triangle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button 
              onClick={fetchMatchesData} 
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
    <div className={styles.chats}>
      <div className={styles.header}>
        <h1>Chats</h1>
      </div>
      <div className={styles.container}>
        {chats.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fa fa-comments"></i>
            <h3>No conversations yet</h3>
            <p>Start chatting with your matches!</p>
          </div>
        ) : (
           <div className={styles.grid}>
             {chats.map((chat) => (
               <Card
                 key={chat.id}
                 className={styles.chatCard}
                 photos={chat.other_user.photos}
                 currentPhotoIndex={0}
                 showNavigation={false}
                 showIndicators={false}
                 onClick={() => handleCardClick(chat.id)}
               >
                 <div className={styles.nameAge}>
                   <h3>{chat.other_user.name}, {chat.other_user.age}</h3>
                   <div className={styles.category}>
                     <i className="fa fa-venus-mars"></i>
                     <span>{chat.other_user.gender === 'Male' ? 'Male' : chat.other_user.gender === 'Female' ? 'Female' : 'Other'}</span>
                   </div>
                 </div>
                 
                 {chat.last_message && (
                   <div className={styles.lastMessage}>
                     <i className="fa fa-comment"></i>
                     <span>{chat.last_message}</span>
                   </div>
                 )}
                 
                 {chat.other_user.bio && (
                   <div className={styles.bioPreview}>
                     {chat.other_user.bio}
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

export default Chats;
