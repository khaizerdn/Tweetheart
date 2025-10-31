import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../../../components/Card';
import MobileMenu from '../../../components/MobileMenu';
import FilterContainer from './components/FilterContainer';
import requestAccessToken from '../../../api/requestAccessToken';
import styles from './styles.module.css';
import CardInfo from '../../../components/Card/CardInfo.jsx';
import Loading from './features/Loading';
import Error from './features/Error';
import LocationRequired from './features/LocationRequired';
import MatchModal from './components/MatchModal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Content = ({ locationGranted, setLocationGranted }) => {
  const [cards, setCards] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Track users to exclude from feed
  const [likedUserIds, setLikedUserIds] = useState([]);
  const [passedUserIds, setPassedUserIds] = useState([]);

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [removedCards, setRemovedCards] = useState(new Set());
  const [isMoving, setIsMoving] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [blockPhotoNavigation, setBlockPhotoNavigation] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({});
  const [swipeDistance, setSwipeDistance] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [swipedCount, setSwipedCount] = useState(0);
  const [swipingCards, setSwipingCards] = useState(new Set());
  
  // Match modal state
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

  const [isRequesting, setIsRequesting] = useState(false);
  const [locError, setLocError] = useState("");
  const [locationAttemptCount, setLocationAttemptCount] = useState(0);
  const [showTooManyAttempts, setShowTooManyAttempts] = useState(false);

  const containerRef = useRef(null);
  const cardRefs = useRef({});

  // Fetch liked users (not matches) on mount
  useEffect(() => {
    const loadLikedAndPassedUsers = async () => {
      try {
        // Fetch liked users
        const likedRes = await fetch(`${API_URL}/likes/liked`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (likedRes.ok) {
          const likedData = await likedRes.json();
          const likeIds = (likedData.likedUsers || []).map(u => u.id).filter(Boolean);
          setLikedUserIds(likeIds);
        }
        // Fetch passed users
        const passRes = await fetch(`${API_URL}/likes/passed`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (passRes.ok) {
          const passData = await passRes.json();
          const passIds = (passData.passedUsers || []).map(u => u.id).filter(Boolean);
          setPassedUserIds(passIds);
        }
      } catch (e) {
        console.warn('Failed to load liked/passed users for feed filtering');
      }
    };
    loadLikedAndPassedUsers();
  }, []);

  // Fetch users data with pagination
  const fetchUsers = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }
      
      const response = await requestAccessToken.get(`/users/feed?page=${page}&limit=10&minAge=${filters.minAge}&maxAge=${filters.maxAge}&distance=${filters.distance}`);
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
      
      // Filter out users that are already liked or passed
      const excludeSet = new Set([...likedUserIds, ...passedUserIds]);
      const filteredTransformed = transformedCards.filter(user => !excludeSet.has(user.id));
      
      if (append) {
        setCards(prevCards => [...prevCards, ...filteredTransformed]);
      } else {
        setCards(filteredTransformed);
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
  }, [filters, likedUserIds, passedUserIds]);

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

  // If geolocation permission is already granted, auto-fetch and save location without asking
  useEffect(() => {
    let isCancelled = false;
    try {
      if (navigator?.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: 'geolocation' })
          .then((result) => {
            if (isCancelled) return;
            if (result.state === 'granted' && !locationGranted) {
              getLocationAndSave();
            }
          })
          .catch(() => {
            // Silently ignore if Permissions API is unavailable or errors out
          });
      }
    } catch (_) {
      // No-op
    }
    return () => {
      isCancelled = true;
    };
  }, [locationGranted]);

  // Refetch users when age range changes
  useEffect(() => {
    if (loaded) {
      fetchUsers(1, false);
    }
  }, [filters, loaded, fetchUsers]);

  const getLocationAndSave = async () => {
    if (locationAttemptCount >= 3) {
      setShowTooManyAttempts(true);
      return;
    }
    setLocationAttemptCount(cnt => cnt + 1);
    setIsRequesting(true);
    setLocError("");
    setShowTooManyAttempts(false);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`${API_URL}/update-location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ latitude, longitude })
            });
            if (response.status === 200) {
              setLocationGranted(true);
            } else {
              const data = await response.json();
              throw new Error(data.message || "Failed to save location. Please try again.");
            }
          } catch (err) {
            setLocError(err.message || "Failed to save location. Please try again.");
            setIsRequesting(false);
          }
        },
        (err) => {
          let errorMessage = "Failed to get location. ";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage += "Please enable location access in your browser settings.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case err.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
              break;
          }
          setLocError(errorMessage);
          setIsRequesting(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (err) {
      setLocError(err.message || "An error occurred. Please try again.");
      setIsRequesting(false);
    }
  };

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
    // Prevent default to avoid text selection and other unwanted behaviors
    if (e.preventDefault) e.preventDefault();
    // Stop propagation to prevent photo navigation
    if (e.stopPropagation) e.stopPropagation();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setDragStart({ x: clientX, y: clientY });
    setDragCurrent({ x: clientX, y: clientY });
    setIsDragging(true);
    setIsMoving(true);
    setHasDragged(false);
    // Temporarily block photo navigation when drag starts
    // Will be unblocked if no drag movement occurs
    setBlockPhotoNavigation(true);
  };

  const handleMove = (e, cardId) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Mark that we've dragged (even slightly)
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setHasDragged(true);
    }
    
    setDragCurrent({ x: clientX, y: clientY });
    setSwipeDistance(deltaX);
    
    const cardElement = cardRefs.current[cardId];
    if (cardElement) {
      const xMulti = deltaX * 0.03;
      const yMulti = deltaY / 80;
      const rotate = xMulti * yMulti;
      
      cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
    }

  };

  const handleEnd = (e, cardId) => {
    if (!isDragging) return;
    
    const deltaX = dragCurrent.x - dragStart.x;
    const deltaY = dragCurrent.y - dragStart.y;
    const velocityX = deltaX / (Date.now() - (e.timeStamp || Date.now()));
    
    const hadDragMovement = hasDragged;
    
    setIsDragging(false);
    setIsMoving(false);
    setHasDragged(false);
    
    // Block photo navigation for a short time after drag ends to prevent accidental clicks
    if (hadDragMovement) {
      // Prevent event propagation
      if (e.stopPropagation) e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
      
      // Keep photo navigation blocked and unblock after a short delay
      setTimeout(() => {
        setBlockPhotoNavigation(false);
      }, 300); // 300ms should be enough to prevent accidental clicks
    } else {
      // No drag movement, unblock immediately
      setBlockPhotoNavigation(false);
    }
    
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
      const response = await fetch(`${API_URL}/likes`, {
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
            // Remove matched user from Home feed immediately
            setCards(prev => prev.filter(card => card.id !== cardId));
            setRemovedCards(prev => new Set([...prev, cardId]));
            setLikedUserIds(prev => (prev.includes(cardId) ? prev : [...prev, cardId]));
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

  const nextPhoto = (cardId, e) => {
    // Prevent photo navigation if a drag just ended
    if (blockPhotoNavigation) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      return;
    }
    
    if (e) e.stopPropagation();
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
    // Prevent photo navigation if a drag just ended
    if (blockPhotoNavigation) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      return;
    }
    
    if (e) e.stopPropagation();
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
    return <Loading />;
  }

  // Show error state
  if (error) {
    return <Error error={error} />;
  }

  if (!locationGranted) {
    return (
      <LocationRequired
        isMobile={isMobile}
        error={locError}
        isRequesting={isRequesting}
        showTooManyAttempts={showTooManyAttempts}
        onGetLocation={getLocationAndSave}
      />
    );
  }

  return (
    <div className={styles.home} ref={containerRef}>
      
      {/* Filter button - always visible */}
      <button 
        className={styles.filterButton}
        onClick={() => setShowFilters(!showFilters)}
        title="Open filters"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6L15 12v6a1 1 0 0 1-1.447.894l-4-2A1 1 0 0 1 9 16v-4L3.2 5.6A1 1 0 0 1 3 5z"/>
        </svg>
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
          <MatchModal matchUser={matchUser} onClose={closeMatchModal} />
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
              <p>You've swiped through all {totalUsers} cards.</p>
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
        {!allCardsSwiped && (
          <div className={styles.buttons}>
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
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Content;
