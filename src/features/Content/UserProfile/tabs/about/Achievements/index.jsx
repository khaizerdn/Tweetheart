import React from "react";
import styles from "./styles.module.css";
import { achievements } from "./data";
import OptionButton from "../../../../../../components/OptionButton";

const Achievements = () => {
  const grouped = achievements.reduce((acc, item) => {
    const year = String(item.year ?? "Unknown");
    acc[year] = acc[year] || [];
    acc[year].push(item);
    return acc;
  }, {});

  const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

  return (
    <div className={styles.achievements}>
      <div className={styles.sectionTitle}>Achievements
          <OptionButton
            onClick={() => setIsModalOpen(true)}
            className="ml-auto"
          />
      </div>
      <div className={styles.achievementList}>
        {sortedYears.map((year) => (
          <div className={styles.achievementGroup} key={year}>
            <div className={styles.achievementYearHeader}>{year}</div>
            {grouped[year].map((item, idx) => (
              <div className={styles.achievementItem} key={`${year}-${idx}`}>
                <div className={styles.achievementMonth}>{item.month}</div>
                <div className={styles.achievementTitle} title={item.title}>
                  {item.title}
                </div>
                <div className={styles.achievementChevron} aria-hidden>
                  &rsaquo;
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;