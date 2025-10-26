import React, { useState } from "react";
import styles from "./styles.module.css";
import { schedules } from "./data";

const Schedules = () => {
  const [visibleCount, setVisibleCount] = useState(3);

  if (!schedules || schedules.length === 0) {
    return (
      <div className={styles.schedules}>
        <div className={styles.sectionTitle}>Schedules</div>
        <div className={styles.noSchedules}>No schedules</div>
      </div>
    );
  }

  const visibleSchedules = schedules.slice(0, visibleCount);

  const handleViewMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, schedules.length));
  };

  const handleShowLess = () => {
    setVisibleCount(3);
  };

  const shouldShowButton = schedules.length > 3;

  return (
    <div className={styles.schedules}>
      <div className={styles.sectionTitle}>Schedules</div>
      <div className={styles.scheduleList}>
        {visibleSchedules.map((item, index) => (
          <div className={styles.scheduleItem} key={index}>
            <img src={item.img} alt={item.title} className={styles.scheduleImg} />
            <div className={styles.scheduleInfo}>
              <div className={styles.scheduleDate}>{item.date}</div>
              <div className={styles.scheduleTitle}>{item.title}</div>
              <div className={styles.scheduleDescription}>{item.description}</div>
            </div>
          </div>
        ))}
      </div>
      {shouldShowButton && (
        <div className={styles.viewMoreContainer}>
          {visibleCount < schedules.length ? (
            <span className={styles.viewMoreText} onClick={handleViewMore}>
              View More
            </span>
          ) : (
            <span className={styles.viewMoreText} onClick={handleShowLess}>
              Show Less
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Schedules;