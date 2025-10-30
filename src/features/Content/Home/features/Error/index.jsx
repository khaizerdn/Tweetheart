import React from 'react';
import styles from '../../styles.module.css';

const Error = ({ error }) => {
  return (
    <div className={styles.home}>
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
};

export default Error;

