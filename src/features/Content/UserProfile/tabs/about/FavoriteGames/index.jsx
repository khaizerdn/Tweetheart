import React, { useRef, useState, useEffect } from "react";
import styles from "./styles.module.css";
import allGames from "./data.json";
import axios from "axios";
import OptionButton from "../../../../../../components/OptionButton";
import ModalAlertDialog from "../../../../../../components/Modals/ModalAlertDialog";

const FavoriteGames = () => {
  const gamesContainerRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [gameStates, setGameStates] = useState({});
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedGames, setSelectedGames] = useState([]);
  const [gameToDelete, setGameToDelete] = useState(null);
  const timeoutsRef = useRef({});
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  const userId = getCookie("userId");

  const checkScrollButtons = () => {
    const container = gamesContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isOverflowing = scrollWidth > clientWidth;
    setShowLeft(isOverflowing && scrollLeft > 0);
    setShowRight(isOverflowing && scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    if (userId) {
      (async () => {
        try {
          const res = await axios.get(`${API_URL}/favorite-games`, {
            withCredentials: true,
          });
          const gameNames = res.data.games || [];
          const favoriteObjects = gameNames
            .map((name) => allGames.find((g) => g.name === name))
            .filter(Boolean);
          setFavorites(favoriteObjects);
          setSelectedGames(gameNames);
        } catch (err) {
          console.error("Failed to fetch favorites:", err);
        }
      })();
    }
  }, [userId]);

  useEffect(() => {
    const container = gamesContainerRef.current;
    if (!container) return;
    checkScrollButtons();
    container.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);
    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, []);

  useEffect(() => checkScrollButtons(), [favorites]);

  const scrollGames = (direction) => {
    const container = gamesContainerRef.current;
    container.scrollBy({
      left: direction === "left" ? -600 : 600,
      behavior: "smooth",
    });
  };

  const deleteAllFavorites = async () => {
    try {
      await axios.post(
        `${API_URL}/favorite-games`,
        { games: [] },
        { withCredentials: true }
      );
      setFavorites([]);
      setSelectedGames([]);
      setIsConfirmOpen(false);
      setAlertMessage("All favorite games have been removed.");
      setIsAlertOpen(true);
    } catch (err) {
      console.error("Failed to delete all favorites:", err);
    }
  };

  const deleteFavoriteGame = async (gameName) => {
    try {
      const updatedGames = selectedGames.filter((name) => name !== gameName);
      await axios.post(
        `${API_URL}/favorite-games`,
        { games: updatedGames },
        { withCredentials: true }
      );
      const newFavorites = updatedGames
        .map((name) => allGames.find((g) => g.name === name))
        .filter(Boolean);
      setFavorites(newFavorites);
      setSelectedGames(updatedGames);
      setGameToDelete(null);
      setAlertMessage(`"${gameName}" has been removed from your favorites.`);
      setIsAlertOpen(true);
    } catch (err) {
      console.error("Failed to delete favorite game:", err);
    }
  };

  const handleOptionSelect = (option) => {
    if (option === "Edit") setIsModalOpen(true);
    else if (option === "Delete all") setIsConfirmOpen(true);
  };

  const filteredGames = allGames.filter((game) =>
    game.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.favoriteGames}>
      <div className={styles.sectionTitle}>
        <span>Favorite Games</span>
        {userId && (
          <OptionButton
            options={["Edit", "Delete all"]}
            onSelect={handleOptionSelect}
            className="ml-auto"
          />
        )}
      </div>

      <div className={styles.gamesWrapper}>
        {showLeft && (
          <button
            className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
            onClick={() => scrollGames("left")}
            aria-label="Scroll Left"
          >
            <svg viewBox="0 0 24 24">
              <path d="M22.6,10.3c-0.1,0-0.2,0-0.3,0H5.3l0.4-0.2c0.4-0.2,0.7-0.4,1-0.7l4.7-4.7c0.6-0.6,0.7-1.6,0.2-2.3C11.1,1.6,10,1.5,9.3,2c-0.1,0-0.1,0.1-0.2,0.1l-8.6,8.6c-0.7,0.7-0.7,1.8,0,2.4l0,0l8.6,8.6c0.7,0.7,1.8,0.7,2.4,0c0.1-0.1,0.1-0.1,0.1-0.2c0.5-0.7,0.4-1.7-0.2-2.3l-4.7-4.8c-0.3-0.3-0.5-0.5-0.9-0.6l-0.5-0.2h16.9c0.9,0,1.6-0.6,1.8-1.4C24.1,11.3,23.5,10.5,22.6,10.3z" />
            </svg>
          </button>
        )}

        <div className={styles.gamesContainer} ref={gamesContainerRef}>
          {favorites.map((game, index) => {
            const { loading, completed, visible } = gameStates[index] || {};
            const showOverlay = visible || loading || completed;

            return (
              <div
                className={styles.gameCard}
                key={index}
                onClick={() => setGameToDelete(game.name)}
              >
                <div className={styles.gameImage}>
                  <img src={game.img} alt={game.name} />
                  <div className={`${styles.overlay} ${showOverlay ? styles.overlayActive : ""}`}>
                    {loading ? (
                      <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <span className="cancel-text">Cancel</span>
                      </div>
                    ) : completed ? (
                      <span>Removed!</span>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          fill="currentColor"
                        >
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        <span>Remove</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.gameName}>{game.name}</div>
              </div>
            );
          })}

          {userId &&
            Array.from({ length: Math.max(0, 5 - favorites.length) }).map(
              (_, index) => (
                <div
                  className={`${styles.gameCard} ${styles.gameCardDecoy}`}
                  key={`decoy-${index}`}
                  onClick={() => setIsModalOpen(true)}
                >
                  <div className={`${styles.gameImage} ${styles.gameImageDecoyImage}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="48"
                      height="48"
                      fill="currentColor"
                    >
                      <path
                        d="M12 5v14m7-7H5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className={styles.gameName}>
                    {index === 0 ? "Add Favorite Game" : ""}
                  </div>
                </div>
              )
            )}
        </div>

        {showRight && (
          <button
            className={`${styles.scrollButton} ${styles.scrollButtonRight}`}
            onClick={() => scrollGames("right")}
            aria-label="Scroll Right"
          >
            <svg viewBox="0 0 24 24">
              <path d="M1.4,13.7c0.1,0,0.2,0,0.3,0h16.9l-0.4,0.2c-0.4,0.2-0.7,0.4-1,0.7l-4.7,4.7c-0.6,0.6-0.7,1.6-0.2,2.3c0.6,0.8,1.6,0.9,2.4,0.4c0.1,0,0.1-0.1,0.2-0.1l8.6-8.6c0.7-0.7,0.7-1.8,0-2.4l0,0l-8.6-8.6c-0.7-0.7-1.8-0.7-2.4,0c-0.1,0.1-0.1,0.1-0.1,0.2c-0.5,0.7-0.4,1.7,0.2,2.3l4.7,4.8c0.3,0.3,0.5,0.5,0.9,0.6l0.5,0.2H1.8c-0.9,0-1.6-0.6-1.8,1.4C-0.1,12.7,0.5,13.5,1.4,13.7z" />
            </svg>
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Select Favorite Games (up to 5)</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              className={styles.searchInput}
            />
            <div className={styles.gamesList}>
              {filteredGames.map((game) => (
                <label key={game.name} className={styles.gameCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedGames.includes(game.name)}
                    onChange={() => {
                      setSelectedGames((prev) =>
                        prev.includes(game.name)
                          ? prev.filter((g) => g !== game.name)
                          : prev.length < 5
                          ? [...prev, game.name]
                          : prev
                      );
                    }}
                    disabled={
                      !selectedGames.includes(game.name) &&
                      selectedGames.length >= 5
                    }
                  />
                  {game.name}
                </label>
              ))}
            </div>
            <div className={styles.modalButtons}>
              <button
                onClick={async () => {
                  try {
                    await axios.post(
                      `${API_URL}/favorite-games`,
                      { games: selectedGames },
                      { withCredentials: true }
                    );
                    const newFavorites = selectedGames
                      .map((name) => allGames.find((g) => g.name === name))
                      .filter(Boolean);
                    setFavorites(newFavorites);
                    setIsModalOpen(false);
                  } catch (err) {
                    console.error("Failed to save favorites:", err);
                  }
                }}
              >
                Save
              </button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ModalAlertDialog
        isOpen={isConfirmOpen}
        title="Delete All Favorites?"
        message="Are you sure you want to delete all your favorite games?"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={deleteAllFavorites}
        onCancel={() => setIsConfirmOpen(false)}
        type="confirm"
      />

      <ModalAlertDialog
        isOpen={isAlertOpen}
        title={alertMessage.includes("All") ? "All Favorites Removed" : `${alertMessage.match(/"([^"]+)"/)?.[1]} Removed`}
        message={alertMessage}
        proceedText="OK"
        onProceed={() => setIsAlertOpen(false)}
        type="alert"
      />

      {gameToDelete && (
        <ModalAlertDialog
          isOpen={!!gameToDelete}
          title={`Remove ${gameToDelete}?`}
          message={`Are you sure you want to remove ${gameToDelete} from your favorite games?`}
          confirmText="Confirm"
          cancelText="Cancel"
          onConfirm={() => deleteFavoriteGame(gameToDelete)}
          onCancel={() => setGameToDelete(null)}
          type="confirm"
        />
      )}
    </div>
  );
};

export default FavoriteGames;