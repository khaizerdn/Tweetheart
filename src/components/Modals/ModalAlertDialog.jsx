import React from "react";
import { createPortal } from 'react-dom';

const ModalAlertDialog = ({
  isOpen,
  title = "Alert",
  message,
  confirmText = "Yes",
  cancelText = "No",
  proceedText = "Proceed",
  onConfirm,
  onCancel,
  onProceed,
  type = "confirm", // "confirm" | "alert"
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) onCancel?.();
  };

  return createPortal(
    <>
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">{title}</div>
          {message && <div className="modal-message">{message}</div>}

          <div className="modal-buttons">
            {type === "confirm" ? (
              <>
                <button className="cancel-btn" onClick={onCancel}>
                  {cancelText}
                </button>
                <button className="confirm-btn" onClick={onConfirm}>
                  {confirmText}
                </button>
              </>
            ) : (
              <button className="save-btn" onClick={onProceed}>
                {proceedText}
              </button>
            )}
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
          background: var(--background-color-1);
          color: var(--text-default);
          border: 1px solid var(--background-color-primary-default-1);
          border-radius: var(--border-radius-016);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: var(--gap-016);
          width: 100%;
          max-width: 360px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          animation: fadeIn 0.25s ease;
        }

        .modal-title {
          font-size: var(--font-size-018);
          color: var(--text-default);  
        }

        .modal-message {
          font-size: var(--font-size-016);
          color: var(--color-primary-default);
        }

        .modal-buttons {
          display: flex;
          justify-content: right;
          gap: 10px;
        }

        .confirm-btn,
        .cancel-btn,
        .save-btn {
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: var(--font-size-016);
          transition: background 0.3s ease, color 0.3s ease;
          min-width: 100px;
        }

        .save-btn {
          background: var(--container-color-light-3);
          color: var(--color-primary-dark);
        }

        .save-btn:hover {
          background: var(--container-color-light-4);
          color: var(--color-max-dark);
        }

        .confirm-btn {
          background: var(--background-color-secondary-default);
          color: var(--font-color-secondary-default);
        }

        .confirm-btn:hover {
          background: var(--background-color-secondary-hover);
          color: var(--font-color-secondary-hover);
        }

        .cancel-btn {
          background: var(--background-color-2);
          color: var(--font-color-primary-default);
        }

        .cancel-btn:hover {
          background: var(--background-color-3);
          color: var(--font-color-primary-hover);
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
    </>
, document.body);
};

export default ModalAlertDialog;