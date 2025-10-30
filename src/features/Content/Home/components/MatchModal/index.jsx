import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModalAlertDialog from '../../../../../components/Modals/ModalAlertDialog';

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
    <ModalAlertDialog
      isOpen={true}
      title="It's a Match!"
      message={`You and ${matchUser.name} liked each other!`}
      type="confirm"
      confirmText="Send Message"
      cancelText="Keep Swiping"
      onConfirm={handleSendMessage}
      onCancel={onClose}
    />
  );
};

export default MatchModal;

