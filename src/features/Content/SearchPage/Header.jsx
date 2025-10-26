import React, { useState } from "react";

function Header() {
  const [query, setQuery] = useState("");

  const handleInput = (event) => {
    setQuery(event.target.value);
  };

  return (
    <>
      <header className="search-header">
        <div className="input-section-one">
          <div className="input-section-one-group search-input-with-icon">
            <div className="search-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="var(--font-color-muted)"
              >
                <path d="M20.7,19.1l-3.5-3.5c2.6-3.5,1.9-8.4-1.6-11s-8.4-1.9-11,1.6s-1.9,8.4,1.6,11c2.8,2.1,6.6,2.1,9.4,0l3.5,3.5c0.4,0.4,1.1,0.4,1.6,0C21.1,20.2,21.1,19.5,20.7,19.1L20.7,19.1z M10.9,16.5c-3.1,0-5.6-2.5-5.6-5.6s2.5-5.6,5.6-5.6s5.6,2.5,5.6,5.6C16.5,14,14,16.5,10.9,16.5z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              name="search"
              placeholder="Search Gamecord"
              value={query}
              onChange={handleInput}
              autoComplete="off"
            />
          </div>
        </div>
      </header>

      {/* Local CSS */}
      <style>{`
        .search-header {
          height: fit-content;
          width: 100%;
          display: flex;
          padding: 10px 10px;
          border-bottom: 1px solid var(--background-color-3);
        }

        .input-section-one-group {
          display: flex;
          flex-direction: column;
          height: fit-content;
          min-width: 0;
          padding: 10px;
          border: 1px solid var(--background-color-4);
          border-radius: var(--border-radius);
          background-color: var(--background-color-3);
          color: var(--font-color-muted);
          gap: 2px;
        }

        .input-section-one-group input {
          width: 100%;
          border: none;
          background-color: transparent;
          color: var(--font-color-muted);
          font-family: var(--font-family-primary);
          font-size: var(--font-size-016);
        }

        .input-section-one-group input:focus {
          color: var(--font-color-default);
          outline: none;
        }

        .search-input-with-icon {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }

        .search-input-with-icon .search-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--font-color-muted);
        }

        .search-input-with-icon input {
          flex: 1;
        }
      `}</style>
    </>
  );
}

export default Header;
