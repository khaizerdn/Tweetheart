import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../../components/Buttons/Button';
import styles from './styles.module.css';

const MatchModal = ({ matchUser, onClose }) => {
  const navigate = useNavigate();

  if (!matchUser) return null;

  const handleSendMessage = () => {
    if (!matchUser?.id) {
      onClose();
      return;
    }
    const targetMatchId = matchUser.id;
    onClose();
    navigate('/matches', { state: { openPreparationForMatchId: targetMatchId } });
  };

  return (
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
          <Button type="primary" position="center" onClick={onClose}>
            Keep Swiping
          </Button>
          <Button
            type="secondary"
            position="center"
            onClick={handleSendMessage}
          >
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;

