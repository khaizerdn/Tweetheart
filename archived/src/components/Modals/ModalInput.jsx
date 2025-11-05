import React, { useState } from "react";
import { createPortal } from 'react-dom';

const ModalInput = ({
  onSave,
  title = "Edit Bio",
  placeholder = "Enter your bio",
  openModalInput = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bio, setBio] = useState("");

  const handleClose = () => {
    setIsOpen(false);
    setBio("");
  };

  const handleSave = async () => {
    try {
      await onSave(bio);
      handleClose();
    } catch (err) {
      console.error("Failed to update bio:", err);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) handleClose();
  };

  // Expose openModalInput function to parent
  openModalInput.current = () => setIsOpen(true);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">{title}</div>
          <textarea
            className="modal-input"
            placeholder={placeholder}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
          <div className="modal-buttons">
            <button className="cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-container {
          background: var(--background-color-3);
          color: var(--text-default);
          border-radius: var(--border-radius);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 90%;
          max-width: 360px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          animation: fadeIn 0.25s ease;
        }

        .modal-title {
          font-size: var(--font-size-016);
          color: var(--text-default);
        }

        .modal-input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--background-color-4);
          border-radius: var(--border-radius);
          background: var(--background-color-2);
          color: var(--text-default);
          font-size: var(--font-size-016);
          resize: vertical;
        }

        .modal-input:focus {
          outline: none;
        }

        .modal-buttons {
          display: flex;
          justify-content: right;
          gap: 10px;
        }

        .save-btn,
        .cancel-btn {
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: var(--font-size-016);
          transition: background 0.2s ease;
          min-width: 100px;
        }

        .save-btn {
          background: var(--text-muted);
          color: var(--color-primary-dark);
        }

        .save-btn:hover {
          background: var(--text-default);
          color: var(--color-primary-dark);
        }

        .cancel-btn {
          background: var(--background-color-4);
          color: var(--text-default);
        }

        .cancel-btn:hover {
          background: var(--background-color-5);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>,
    document.body
  );
};

export default ModalInput;