import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';

const Content = () => {
  const [cards, setCards] = useState([
    {
      id: 1,
      name: "Sofia",
      age: 22,
      bio: "Love hiking, photography, and trying new restaurants. Looking for someone to share adventures with!",
      category: "Basics & Lifestyle",
      tags: ["Socially on weekends", "Non-smoker", "Sometimes", "Want a pet"],
      photos: [
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face"
      ]
    },
    {
      id: 2,
      name: "Michael",
      age: 28,
      bio: "Software engineer by day, chef by night. Love cooking, gaming, and weekend road trips.",
      category: "Basics & Lifestyle",
      tags: ["Tech enthusiast", "Foodie", "Gamer", "Weekend traveler"],
      photos: [
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face"
      ]
    },
    {
      id: 3,
      name: "Emma",
      age: 23,
      bio: "Art student passionate about painting and music. Always up for museum visits and live concerts!",
      category: "Basics & Lifestyle",
      tags: ["Artist", "Music lover", "Museum goer", "Creative"],
      photos: [
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face"
      ]
    },
    {
      id: 4,
      name: "David",
      age: 30,
      bio: "Fitness enthusiast and travel blogger. Love exploring new cultures and staying active.",
      category: "Basics & Lifestyle",
      tags: ["Fitness", "Traveler", "Adventure seeker", "Healthy lifestyle"],
      photos: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face"
      ]
    },
    {
      id: 5,
      name: "Lisa",
      age: 26,
      bio: "Teacher who loves reading, yoga, and coffee. Looking for meaningful connections and good conversations.",
      category: "Basics & Lifestyle",
      tags: ["Educator", "Book lover", "Yoga", "Coffee enthusiast"],
      photos: [
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face"
      ]
    }
  ]);

  const [loaded, setLoaded] = useState(false);
  const [isLoved, setIsLoved] = useState(false);
  const [isNoped, setIsNoped] = useState(false);
  const [removedCards, setRemovedCards] = useState(new Set());
  const [isMoving, setIsMoving] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({});

  const containerRef = useRef(null);
  const cardRefs = useRef({});

  useEffect(() => {
    setLoaded(true);
  }, []);

  const getCurrentCard = () => {
    const visibleCards = cards.filter(card => !removedCards.has(card.id));
    return visibleCards[0] || null;
  };

  const initCards = () => {
    const currentCard = getCurrentCard();
    if (currentCard) {
      const cardElement = cardRefs.current[currentCard.id];
      if (cardElement) {
        cardElement.style.zIndex = 1;
        cardElement.style.transform = 'scale(1) translateY(0px)';
        cardElement.style.opacity = 1;
      }
    }
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
      cardElement.style.transform = 'scale(1) translateY(0px)';
    } else {
      // Remove card and fly to specific points
      setRemovedCards(prev => new Set([...prev, cardId]));
      
      const moveOutWidth = window.innerWidth * 1.5;
      const toX = deltaX > 0 ? moveOutWidth : -moveOutWidth;
      const rotate = deltaX > 0 ? 30 : -30;

      cardElement.style.transform = `translate(${toX}px, -100px) rotate(${rotate}deg)`;
    }
  };

  const handleButtonClick = (action) => {
    const currentCard = getCurrentCard();
    if (!currentCard) return;

    const cardElement = cardRefs.current[currentCard.id];
    if (!cardElement) return;

    const moveOutWidth = window.innerWidth * 1.5;
    
    if (action === 'like') {
      cardElement.style.transform = `translate(${moveOutWidth}px, -100px) rotate(30deg)`;
    } else if (action === 'nope') {
      cardElement.style.transform = `translate(-${moveOutWidth}px, -100px) rotate(-30deg)`;
    } else if (action === 'undo') {
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
    
    setRemovedCards(prev => new Set([...prev, currentCard.id]));
  };

  const resetCards = () => {
    setRemovedCards(new Set());
    setCurrentPhotoIndex({});
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
  const allCardsSwiped = !currentCard;

  return (
    <div className={`${styles.tinder} ${loaded ? styles.loaded : ''}`} ref={containerRef}>
      <div className={styles.cards}>
        {allCardsSwiped ? (
          <div className={styles.emptyState}>
            <i className="fa fa-heart-broken"></i>
            <h3>No more cards!</h3>
            <p>You've swiped through all the cards. Click reset to start over.</p>
          </div>
        ) : (
          <div
            ref={(el) => (cardRefs.current[currentCard.id] = el)}
            className={`${styles.card} ${isMoving ? styles.moving : ''}`}
            onTouchStart={(e) => handleStart(e, currentCard.id)}
            onTouchMove={(e) => handleMove(e, currentCard.id)}
            onTouchEnd={(e) => handleEnd(e, currentCard.id)}
            onMouseDown={(e) => handleStart(e, currentCard.id)}
            onMouseMove={(e) => handleMove(e, currentCard.id)}
            onMouseUp={(e) => handleEnd(e, currentCard.id)}
            onMouseLeave={(e) => handleEnd(e, currentCard.id)}
          >
            <div className={styles.photoContainer}>
              <img 
                src={currentCard.photos[currentPhotoIndex[currentCard.id] || 0]} 
                alt={`${currentCard.name} photo ${(currentPhotoIndex[currentCard.id] || 0) + 1}`} 
                className={styles.photo}
              />
              
              {/* Photo indicators */}
              {currentCard.photos.length > 1 && (
                <div className={styles.photoIndicators}>
                  {currentCard.photos.map((_, index) => (
                    <div
                      key={index}
                      className={`${styles.indicator} ${index === (currentPhotoIndex[currentCard.id] || 0) ? styles.active : ''}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Photo navigation buttons */}
              {currentCard.photos.length > 1 && (
                <>
                  <button
                    className={`${styles.navButton} ${styles.prevButton}`}
                    onClick={(e) => prevPhoto(currentCard.id, e)}
                    aria-label="Previous photo"
                  >
                    <i className="fa fa-chevron-left"></i>
                  </button>
                  <button
                    className={`${styles.navButton} ${styles.nextButton}`}
                    onClick={(e) => nextPhoto(currentCard.id, e)}
                    aria-label="Next photo"
                  >
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </>
              )}
            </div>
            
            <div className={styles.cardInfo}>
              <div className={styles.nameAge}>
                <h3>{currentCard.name}, {currentCard.age}</h3>
                <div className={styles.category}>
                  <i className="fa fa-flag"></i>
                  <span>{currentCard.category}</span>
                </div>
              </div>
              
              <div className={styles.tags}>
                {currentCard.tags.map((tag, index) => (
                  <div key={index} className={styles.tag}>
                    {tag}
                  </div>
                ))}
              </div>
              
              <button className={styles.showMoreButton}>
                Show more
              </button>
              
              <button className={styles.scrollButton}>
                <i className="fa fa-chevron-up"></i>
              </button>
            </div>
          </div>
        )}

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
              onClick={() => handleButtonClick('superlike')}
              className={`${styles.button} ${styles.superLikeButton}`}
            >
              <i className="fa fa-star"></i>
            </button>
            <button 
              onClick={() => handleButtonClick('like')}
              className={`${styles.button} ${styles.likeButton}`}
            >
              <i className="fa fa-heart"></i>
            </button>
            <button 
              onClick={() => handleButtonClick('boost')}
              className={`${styles.button} ${styles.boostButton}`}
            >
              <i className="fa fa-paper-plane"></i>
            </button>
          </>
        )}
      </div>
      </div>

      
    </div>
  );
};

export default Content;
