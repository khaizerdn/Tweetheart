import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
import styles from './styles.module.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    fetchMatches();
  }, []);

  // Handle card click to open chat room
  const handleCardClick = (matchId) => {
    // Get current user ID to create a consistent chat room ID
    const userId = document.cookie
      .split('; ')
      .find(row => row.startsWith('userId='))
      ?.split('=')[1];
    
    if (!userId) {
      console.error('User not authenticated');
      return;
    }
    
    // Create a consistent chat room ID that both users will use
    // Sort the IDs to ensure both users get the same room ID regardless of who clicks first
    const chatRoomId = [userId, matchId].sort().join('_');
    navigate(`/chats/${chatRoomId}`);
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
      </div>
      <div className={styles.container}>

        {matches.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fa fa-heart"></i>
            <h3>No matches yet</h3>
            <p>Keep swiping to find your perfect match!</p>
          </div>
        ) : (
           <div className={styles.grid}>
             {matches.map((match) => (
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
