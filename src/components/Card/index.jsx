import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

/**
 * Reusable Card component for displaying profile cards
 * Used in both Home (swipe cards) and SignUp (preview card)
 */
const Card = React.forwardRef(({
  photos = [],
  currentPhotoIndex = 0,
  onNextPhoto,
  onPrevPhoto,
  children,
  className = '',
  showNavigation = true,
  showIndicators = true,
  placeholder,
  overlays,
  ...props
}, ref) => {
  const [loadedPhotos, setLoadedPhotos] = useState(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const hasPhotos = photos && photos.length > 0;
  const hasMultiplePhotos = photos && photos.length > 1;

  // Preload all photos when component mounts or photos change
  useEffect(() => {
    if (!hasPhotos) return;

    const preloadImages = () => {
      photos.forEach((photoUrl, index) => {
        if (!loadedPhotos.has(index)) {
          const img = new Image();
          img.onload = () => {
            setLoadedPhotos(prev => new Set([...prev, index]));
          };
          img.onerror = () => {
            console.warn(`Failed to load photo ${index}:`, photoUrl);
          };
          img.src = photoUrl;
        }
      });
    };

    preloadImages();
  }, [photos, loadedPhotos]);

  // Handle photo transition with loading state
  const handlePhotoChange = (newIndex) => {
    if (newIndex === currentPhotoIndex) return;
    
    setIsTransitioning(true);
    
    // Reset transition state after a short delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  };

  // Trigger transition when photo index changes
  useEffect(() => {
    handlePhotoChange(currentPhotoIndex);
  }, [currentPhotoIndex]);

  return (
    <div ref={ref} className={`${styles.card} ${className}`} {...props}>
      {/* Optional overlays (like swipe overlays) that sit on top of everything */}
      {overlays}
      
      <div className={styles.photoContainer}>
        {hasPhotos ? (
          <>
            {/* Render all photos but only show the current one */}
            {photos.map((photo, index) => (
              <img 
                key={index}
                src={photo} 
                alt={`Photo ${index + 1}`} 
                className={`${styles.photo} ${index === currentPhotoIndex ? styles.activePhoto : styles.hiddenPhoto}`}
                style={{
                  opacity: index === currentPhotoIndex ? 1 : 0,
                  transition: isTransitioning ? 'opacity 0.15s ease-in-out' : 'none'
                }}
              />
            ))}
            
            {/* Photo indicators */}
            {showIndicators && hasMultiplePhotos && (
              <div className={styles.photoIndicators}>
                {photos.map((_, photoIndex) => (
                  <div
                    key={photoIndex}
                    className={`${styles.indicator} ${photoIndex === currentPhotoIndex ? styles.active : ''}`}
                  />
                ))}
              </div>
            )}
            
            {/* Photo navigation buttons */}
            {showNavigation && hasMultiplePhotos && (
              <>
                <button
                  className={`${styles.navButton} ${styles.prevButton}`}
                  onClick={onPrevPhoto}
                  type="button"
                  aria-label="Previous photo"
                >
                  <i className="fa fa-chevron-left"></i>
                </button>
                <button
                  className={`${styles.navButton} ${styles.nextButton}`}
                  onClick={onNextPhoto}
                  type="button"
                  aria-label="Next photo"
                >
                  <i className="fa fa-chevron-right"></i>
                </button>
              </>
            )}
          </>
        ) : (
          placeholder || (
            <div className={styles.placeholderPhoto}>
              <i className="fa fa-user"></i>
              <p>No photos available</p>
            </div>
          )
        )}
      </div>
      
      {/* Card info overlay - customizable via children */}
      {children && (
        <div className={styles.cardInfo}>
          {children}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;

