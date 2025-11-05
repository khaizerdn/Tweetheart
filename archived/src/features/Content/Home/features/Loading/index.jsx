import React from 'react';
import styles from '../../styles.module.css';

const Loading = () => {
  return (
    <div className={styles.home}>
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
};

export default Loading;

