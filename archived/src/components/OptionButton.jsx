import React, { useState, useRef, useEffect } from "react";

const OptionButton = ({
  options = [],
  onSelect,
  className = "",
  ariaLabel = "Options",
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className={`option-wrapper ${className}`} ref={menuRef}>
        <button
          className="edit-button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={ariaLabel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
          </svg>
        </button>

        {open && (
          <ul className="option-menu">
            {options.map((opt, idx) => (
              <li
                key={idx}
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .option-wrapper {
          position: relative;
          display: inline-block;
          margin-left: auto;
        }

        .edit-button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-button:hover {
          color: var(--text-default);
        }

        .edit-button svg {
          width: 20px;
          height: 20px;
        }

        .option-menu {
          position: absolute;
          right: 0;
          top: 30px;
          background: var(--background-color-3);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border-radius: var(--border-radius);
          list-style: none;
          padding: 10px;
          margin: 0;
          min-width: 180px;
          z-index: 100;
        }

        .option-menu li {
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-radius: 5px;
        }

        .option-menu li:hover {
          background: var(--background-color-4);
          color: var(--text-default);
        }
      `}</style>
    </>
  );
};

export default OptionButton;
