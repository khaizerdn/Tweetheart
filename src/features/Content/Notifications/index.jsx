import React from 'react';
import Header from '../../../components/Header';
import MobileMenu from '../../../components/MobileMenu';
import styles from './styles.module.css';

const Notifications = () => {
  return (
    <div className={styles.notifications}>
      <Header title="Notifications" className={styles.notificationsHeader} />
      <MobileMenu />
    </div>
  );
};

export default Notifications;
