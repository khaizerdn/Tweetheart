import React from 'react';
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
  const hasPhotos = photos && photos.length > 0;
  const hasMultiplePhotos = photos && photos.length > 1;

  return (
    <div ref={ref} className={`${styles.card} ${className}`} {...props}>
      {/* Optional overlays (like swipe overlays) that sit on top of everything */}
      {overlays}
      
      <div className={styles.photoContainer}>
        {hasPhotos ? (
          <>
            <img 
              src={photos[currentPhotoIndex]} 
              alt={`Photo ${currentPhotoIndex + 1}`} 
              className={styles.photo}
            />
            
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

