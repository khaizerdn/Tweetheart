import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../components/Card';
import styles from './styles.module.css';
import { fetchMatches } from '../Matches/server';

const Chats = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { chatId } = useParams();

  // Fetch matches data (same as Matches component)
  const fetchMatchesData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const data = await fetchMatches();
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
        matchedAt: match.matched_at
      }));
      
      setMatches(transformedMatches);
      
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("Failed to load matches. Please try again.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches on component mount
  useEffect(() => {
    fetchMatchesData();
  }, []);

  // Handle card click to open chat room
  const handleCardClick = (matchId) => {
    navigate(`/chats/${matchId}`);
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
        {matches.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fa fa-comments"></i>
            <h3>No conversations yet</h3>
            <p>Start chatting with your matches!</p>
          </div>
        ) : (
           <div className={styles.grid}>
             {matches.map((match) => (
               <Card
                 key={match.id}
                 className={styles.chatCard}
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
                   </div>
                 </div>
                 
                 {match.lastMessage && (
                   <div className={styles.lastMessage}>
                     <i className="fa fa-comment"></i>
                     <span>{match.lastMessage}</span>
                   </div>
                 )}
                 
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

export default Chats;
