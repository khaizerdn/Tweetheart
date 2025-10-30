import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../../../components/Card';
import Header from '../../../components/Header';
import MobileMenu from '../../../components/MobileMenu';
import FilterContainer from '../../../components/FilterContainer';
import requestAccessToken from '../../../api/requestAccessToken';
// Remove likesAPI import since we'll use direct fetch calls
import styles from './styles.module.css';
import CardInfo from '../../../components/Card/CardInfo.jsx';

const Content = ({ locationGranted }) => {
  const [cards, setCards] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [isLoved, setIsLoved] = useState(false);
  const [isNoped, setIsNoped] = useState(false);
  const [removedCards, setRemovedCards] = useState(new Set());
  const [isMoving, setIsMoving] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({});
  const [swipeDistance, setSwipeDistance] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [swipedCount, setSwipedCount] = useState(0);
  const [swipingCards, setSwipingCards] = useState(new Set());
  
  // Likes and matches state
  const [matches, setMatches] = useState([]);
  const [isMatch, setIsMatch] = useState(false);
  const [matchUser, setMatchUser] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 65,
    distance: 50,
    interests: [],
    lifestyle: [],
    education: 'any',
    relationshipType: 'any',
    additionalOptions: []
  });

  const containerRef = useRef(null);
  const cardRefs = useRef({});

  // Fetch users data with pagination
  const fetchUsers = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }
      
      const response = await requestAccessToken.get(`/api/users/feed?page=${page}&limit=10&minAge=${filters.minAge}&maxAge=${filters.maxAge}&distance=${filters.distance}`);
      const { users: usersData, pagination } = response.data;
      
      // Transform the data to match the expected format
      const transformedCards = usersData.map(user => ({
        id: user.id,
        name: user.name,
        age: user.age,
        bio: user.bio,
        gender: user.gender || "",
        photos: user.photos || [],
        distance: user.distance !== undefined && user.distance !== null ? user.distance : null
      }));
      
      if (append) {
        setCards(prevCards => [...prevCards, ...transformedCards]);
      } else {
        setCards(transformedCards);
        setLoaded(true);
      }
      
      // Update pagination state
      setCurrentPage(pagination.currentPage);
      setHasMore(pagination.hasMore);
      setTotalUsers(pagination.totalUsers);
      
    } catch (err) {
      console.error("Error fetching users:", err);
      if (!append) {
        setError("Failed to load users. Please try again.");
        setCards([]);
        setLoaded(true);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [filters]);

  // Load more cards when needed
  const loadMoreCards = async () => {
    if (!loadingMore && hasMore) {
      await fetchUsers(currentPage + 1, true);
    }
  };


  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 685);
    };
    
    // Check on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch initial users data on component mount
  useEffect(() => {
    fetchUsers(1, false);
  }, [fetchUsers]);

  // Refetch users when age range changes
  useEffect(() => {
    if (loaded) {
      fetchUsers(1, false);
    }
  }, [filters, loaded, fetchUsers]);

  const getCurrentCard = () => {
    const visibleCards = cards.filter(card => 
      !removedCards.has(card.id) && !swipingCards.has(card.id)
    );
    return visibleCards[0] || null;
  };

  // Check if we need to load more cards when swiped count changes
  useEffect(() => {
    if (swipedCount > 0 && swipedCount % 5 === 0 && hasMore && !loadingMore) {
      loadMoreCards();
    }
  }, [swipedCount, hasMore, loadingMore, currentPage]);

  const initCards = () => {
    const visibleCards = cards.filter(card => 
      !removedCards.has(card.id) && !swipingCards.has(card.id)
    );
    
    visibleCards.forEach((card, index) => {
      const cardElement = cardRefs.current[card.id];
      if (cardElement) {
        // Stack cards with decreasing z-index only
        cardElement.style.zIndex = visibleCards.length - index;
        
        // All cards same size and position - no scaling or effects
        cardElement.style.transform = 'scale(1) translateY(0px)';
        cardElement.style.opacity = 1;
        
        // No transition - cards should appear instantly in their position
        cardElement.style.transition = 'none';
      }
    });
  };

  useEffect(() => {
    initCards();
  }, [removedCards, cards]);

  const handleStart = (e, cardId) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setDragStart({ x: clientX, y: clientY });
    setDragCurrent({ x: clientX, y: clientY });
    setIsDragging(true);
    setIsMoving(true);
  };

  const handleMove = (e, cardId) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    setDragCurrent({ x: clientX, y: clientY });
    setSwipeDistance(deltaX);
    
    const cardElement = cardRefs.current[cardId];
    if (cardElement) {
      const xMulti = deltaX * 0.03;
      const yMulti = deltaY / 80;
      const rotate = xMulti * yMulti;
      
      cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
    }

    // Update status indicators
    setIsLoved(deltaX > 0);
    setIsNoped(deltaX < 0);
  };

  const handleEnd = (e, cardId) => {
    if (!isDragging) return;
    
    const deltaX = dragCurrent.x - dragStart.x;
    const deltaY = dragCurrent.y - dragStart.y;
    const velocityX = deltaX / (Date.now() - (e.timeStamp || Date.now()));
    
    setIsDragging(false);
    setIsMoving(false);
    setIsLoved(false);
    setIsNoped(false);
    
    const cardElement = cardRefs.current[cardId];
    if (!cardElement) return;

    const threshold = 100; // Minimum distance to trigger swipe
    const keep = Math.abs(deltaX) < threshold;

    if (keep) {
      // Return card to original position
      cardElement.style.transition = 'transform 0.15s ease-out';
      cardElement.style.transform = 'scale(1) translateY(0px)';
      setSwipeDistance(0);
    } else {
      // Determine action based on swipe direction
      const action = deltaX > 0 ? 'like' : 'pass';
      
      // Mark card as swiping so it becomes non-interactive
      setSwipingCards(prev => new Set([...prev, cardId]));
      setSwipedCount(prev => prev + 1);
      setSwipeDistance(0);
      
      // Animate card out smoothly
      const moveOutWidth = window.innerWidth * 0.8;
      const toX = deltaX > 0 ? moveOutWidth : -moveOutWidth;
      const rotate = deltaX > 0 ? 30 : -30;

      // Enable transition for smooth animation
      cardElement.style.transition = 'transform 0.5s ease-out';
      cardElement.style.transform = `translate(${toX}px, -100px) rotate(${rotate}deg)`;
      
      // Handle the like/pass action
      handleUserAction(cardId, action);
      
      // Remove card from state after animation completes
      setTimeout(() => {
        setRemovedCards(prev => new Set([...prev, cardId]));
        setSwipingCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
      }, 500); // Match the transition duration
    }
  };

  const handleButtonClick = (action) => {
    const currentCard = getCurrentCard();
    if (!currentCard) return;

    const cardElement = cardRefs.current[currentCard.id];
    if (!cardElement) return;

    if (action === 'undo') {
      // Undo last action
      const lastRemovedCard = Array.from(removedCards).pop();
      if (lastRemovedCard) {
        setRemovedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(lastRemovedCard);
          return newSet;
        });
      }
      return;
    }

    // Mark card as swiping so it becomes non-interactive
    setSwipingCards(prev => new Set([...prev, currentCard.id]));
    setSwipedCount(prev => prev + 1);
    
    const moveOutWidth = window.innerWidth * 1.5;
    
    // Enable transition for smooth animation
    cardElement.style.transition = 'transform 0.5s ease-out';
    
    if (action === 'like') {
      cardElement.style.transform = `translate(${moveOutWidth}px, -100px) rotate(30deg)`;
      handleUserAction(currentCard.id, 'like');
    } else if (action === 'nope') {
      cardElement.style.transform = `translate(-${moveOutWidth}px, -100px) rotate(-30deg)`;
      handleUserAction(currentCard.id, 'pass');
    }
    
    // Remove card from state after animation completes
    setTimeout(() => {
      setRemovedCards(prev => new Set([...prev, currentCard.id]));
      setSwipingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentCard.id);
        return newSet;
      });
    }, 500); // Match the transition duration
  };

  // Handle user action (like/pass)
  const handleUserAction = async (cardId, action) => {
    try {
      const response = await fetch('http://localhost:8081/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          liked_id: cardId,
          like_type: action
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to record interaction: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (action === 'like') {
        // Check if this creates a match
        if (data.isMatch) {
          const matchedUser = cards.find(card => card.id === cardId);
          if (matchedUser) {
            setMatchUser(matchedUser);
            setIsMatch(true);
            setShowMatchModal(true);
            setMatches(prev => [...prev, matchedUser]);
          }
        }
      }
    } catch (error) {
      console.error('Error handling user action:', error);
      // You might want to show an error message to the user
    }
  };

  // Close match modal
  const closeMatchModal = () => {
    setShowMatchModal(false);
    setIsMatch(false);
    setMatchUser(null);
  };

  const resetCards = () => {
    setRemovedCards(new Set());
    setSwipingCards(new Set());
    setCurrentPhotoIndex({});
    setSwipedCount(0);
    setCurrentPage(1);
    setHasMore(true);
    setMatches([]);
    setIsMatch(false);
    setMatchUser(null);
    setShowMatchModal(false);
    // Reload initial cards
    fetchUsers(1, false);
  };

  const nextPhoto = (cardId, e) => {
    e.stopPropagation();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    const currentIndex = currentPhotoIndex[cardId] || 0;
    const nextIndex = (currentIndex + 1) % card.photos.length;
    setCurrentPhotoIndex(prev => ({
      ...prev,
      [cardId]: nextIndex
    }));
  };

  const prevPhoto = (cardId, e) => {
    e.stopPropagation();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    const currentIndex = currentPhotoIndex[cardId] || 0;
    const prevIndex = currentIndex === 0 ? card.photos.length - 1 : currentIndex - 1;
    setCurrentPhotoIndex(prev => ({
      ...prev,
      [cardId]: prevIndex
    }));
  };

  const currentCard = getCurrentCard();
  const visibleCards = cards.filter(card => !removedCards.has(card.id));
  const allCardsSwiped = visibleCards.length === 0;

  // Show loading state
  if (loading) {
    return (
      <div className={styles.home}>
        {!isMobile && <Header title="Home" />}
        <div className={styles.container}>
          <div className={styles.cardContainer}>
            <div className={styles.cards}>
              <div className={styles.emptyState}>
                <i className="fa fa-spinner fa-spin"></i>
                <h3>Loading users...</h3>
                <p>Finding people near you</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.home}>
        {!isMobile && <Header title="Home" />}
        <div className={styles.container}>
          <div className={styles.cardContainer}>
            <div className={styles.cards}>
              <div className={styles.emptyState}>
                <i className="fa fa-exclamation-triangle"></i>
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className={styles.button}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!locationGranted) {
    return (
      <div className={styles.home}>
        {!isMobile && <Header title="Home" />}
        <div className={styles.container}>
          <div className={styles.cardContainer}>
            <div className={styles.cards}>
              <div className={styles.emptyState}>
                <i className="fa fa-map-marker-alt" style={{fontSize:50}}></i>
                <h3>Location Required to Swipe</h3>
                <p>To start swiping and see matches, you need to allow location access. Please enable location in your settings!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.home} ref={containerRef}>
      {!isMobile && <Header title="Home" />}
      
      {/* Filter button - always visible */}
      <button 
        className={styles.filterButton}
        onClick={() => setShowFilters(!showFilters)}
        title="Open filters"
      >
        <i className="fa-solid fa-filter"></i>
        {(() => {
          const hasActiveFilters = 
            filters.interests.length > 0 ||
            filters.lifestyle.length > 0 ||
            filters.education !== 'any' ||
            /* relationshipType removed from UI */
            filters.additionalOptions?.length > 0 ||
            filters.distance !== 50 ||
            filters.minAge !== 18 ||
            filters.maxAge !== 65;
          return hasActiveFilters && <span className={styles.filterBadge} />;
        })()}
      </button>
      <div className={styles.container}>
        {/* Match Modal */}
        {showMatchModal && matchUser && (
        <div className={styles.matchModal}>
          <div className={styles.matchModalContent}>
            <div className={styles.matchAnimation}>
              <div className={styles.matchHearts}>
                <i className="fa fa-heart"></i>
                <i className="fa fa-heart"></i>
              </div>
            </div>
            <h2>It's a Match!</h2>
            <p>You and {matchUser.name} liked each other!</p>
            <div className={styles.matchActions}>
              <button 
                onClick={closeMatchModal}
                className={`${styles.button} ${styles.matchButton}`}
              >
                Keep Swiping
              </button>
              <button 
                onClick={closeMatchModal}
                className={`${styles.button} ${styles.messageButton}`}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Container */}
      <FilterContainer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setShowFilters(false);
          // Reset cards and fetch with new filters
          setRemovedCards(new Set());
          setSwipingCards(new Set());
          setCurrentPhotoIndex({});
          setSwipedCount(0);
          setCurrentPage(1);
          setHasMore(true);
          fetchUsers(1, false);
        }}
        onResetFilters={() => {
          const defaultFilters = {
            minAge: 18,
            maxAge: 65,
            distance: 50,
            interests: [],
            lifestyle: [],
            education: 'any',
            relationshipType: 'any',
            additionalOptions: []
          };
          setFilters(defaultFilters);
          setRemovedCards(new Set());
          setSwipingCards(new Set());
          setCurrentPhotoIndex({});
          setSwipedCount(0);
          setCurrentPage(1);
          setHasMore(true);
          fetchUsers(1, false);
        }}
      />
      
      <div className={styles.cardContainer}>
        <div className={styles.cards}>
          {allCardsSwiped ? (
            <div className={styles.emptyState}>
              <i className="fa fa-heart-broken"></i>
              <h3>No more cards!</h3>
              <p>You've swiped through all {totalUsers} cards. Click reset to start over.</p>
            </div>
          ) : (
            <>
              {visibleCards.slice(0, 3).reverse().map((card, reverseIndex) => {
                const index = visibleCards.slice(0, 3).length - 1 - reverseIndex;
                const isTopCard = index === 0;
                const isSwiping = swipingCards.has(card.id);
                const isInteractive = isTopCard && !isSwiping;
                
                return (
                  <Card
                    key={card.id}
                    ref={(el) => (cardRefs.current[card.id] = el)}
                    className={`${styles.swipeCard} ${isTopCard && isMoving ? styles.moving : ''}`}
                    photos={card.photos}
                    currentPhotoIndex={currentPhotoIndex[card.id] || 0}
                    onNextPhoto={isInteractive ? (e) => nextPhoto(card.id, e) : undefined}
                    onPrevPhoto={isInteractive ? (e) => prevPhoto(card.id, e) : undefined}
                    showNavigation={isInteractive && card.photos.length > 1}
                    showIndicators={isInteractive && card.photos.length > 1}
                    onTouchStart={isInteractive ? (e) => handleStart(e, card.id) : undefined}
                    onTouchMove={isInteractive ? (e) => handleMove(e, card.id) : undefined}
                    onTouchEnd={isInteractive ? (e) => handleEnd(e, card.id) : undefined}
                    onMouseDown={isInteractive ? (e) => handleStart(e, card.id) : undefined}
                    onMouseMove={isInteractive ? (e) => handleMove(e, card.id) : undefined}
                    onMouseUp={isInteractive ? (e) => handleEnd(e, card.id) : undefined}
                    onMouseLeave={isInteractive ? (e) => handleEnd(e, card.id) : undefined}
                    style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
                    overlays={isInteractive && (
                      <>
                        <div 
                          className={styles.swipeOverlayLeft} 
                          style={{ 
                            opacity: swipeDistance < 0 ? Math.min(Math.abs(swipeDistance) / 100, 0.7) : 0 
                          }}
                        />
                        <div 
                          className={styles.swipeOverlayRight} 
                          style={{ 
                            opacity: swipeDistance > 0 ? Math.min(swipeDistance / 100, 0.7) : 0 
                          }}
                        />
                      </>
                    )}
                  >
                    <CardInfo 
                      name={card.name}
                      age={card.age}
                      gender={card.gender}
                      distance={card.distance}
                      bio={card.bio}
                      classNames={{
                        nameAge: styles.nameAge,
                        category: styles.category,
                        distance: styles.distance,
                        bioPreview: styles.bioPreview,
                      }}
                    />
                  </Card>
                );
              })}
            </>
          )}
          
          {/* Loading more cards indicator */}
          {loadingMore && (
            <div className={styles.loadingMore}>
              <i className="fa fa-spinner fa-spin"></i>
              <span>Loading more cards...</span>
            </div>
          )}
        </div>
        <MobileMenu />
        {/* Action buttons positioned below the card */}
        <div className={styles.buttons}>
          {allCardsSwiped ? (
            <button 
              onClick={resetCards}
              className={`${styles.button} ${styles.resetButton}`}
            >
              <i className="fa fa-refresh"></i>
              <span>Reset Cards</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => handleButtonClick('undo')}
                className={`${styles.button} ${styles.undoButton}`}
              >
                <i className="fa fa-undo"></i>
              </button>
              <button 
                onClick={() => handleButtonClick('nope')}
                className={`${styles.button} ${styles.nopeButton}`}
              >
                <i className="fa fa-times"></i>
              </button>
              <button 
                onClick={() => handleButtonClick('like')}
                className={`${styles.button} ${styles.likeButton}`}
              >
                <i className="fa fa-heart"></i>
              </button>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Content;
