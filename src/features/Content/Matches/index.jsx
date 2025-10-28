import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Show loading state
  if (loading) {
    return (
      <div className={styles.matches}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Matches</h1>
          </div>
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
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Matches</h1>
          </div>
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
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Matches</h1>
          <p className={styles.subtitle}>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </p>
        </div>

        {matches.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fa fa-heart"></i>
            <h3>No matches yet</h3>
            <p>Keep swiping to find your perfect match!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {matches.map((match) => (
              <div key={match.id} className={styles.matchCard}>
                <div className={styles.photoContainer}>
                  {match.photos && match.photos.length > 0 ? (
                    <img 
                      src={match.photos[0]} 
                      alt={match.name}
                      className={styles.photo}
                    />
                  ) : (
                    <div className={styles.placeholderPhoto}>
                      <i className="fa fa-user"></i>
                    </div>
                  )}
                  <div className={styles.overlay}>
                    <div className={styles.nameContainer}>
                      <h3 className={styles.name}>{match.name}</h3>
                      {match.age && (
                        <span className={styles.age}>, {match.age}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
