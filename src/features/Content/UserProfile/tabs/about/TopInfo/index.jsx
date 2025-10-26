import React, { useState, useRef, useEffect } from "react";
import styles from "./styles.module.css";
import OptionButton from "../../../../../../components/OptionButton";
import ModalInput from "../../../../../../components/Modals/ModalInput";
import ModalAlertDialog from "../../../../../../components/Modals/ModalAlertDialog";
import axios from "axios";

const TopInfo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [bio, setBio] = useState("");
  const openModalInput = useRef(() => {});
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

  useEffect(() => {
    const fetchBio = async () => {
      try {
        const res = await axios.get(`${API_URL}/bio`, { withCredentials: true });
        setBio(res.data.bio || "");
      } catch (err) {
        console.error("Failed to fetch bio:", err);
      }
    };
    fetchBio();
  }, []);

  const handleBioSave = async (newBio) => {
    try {
      await axios.post(`${API_URL}/bio`, { bio: newBio }, { withCredentials: true });
      setBio(newBio);
    } catch (err) {
      console.error("Failed to update bio:", err);
    }
  };

  const handleBioDelete = async () => {
    try {
      await axios.post(`${API_URL}/bio`, { bio: "" }, { withCredentials: true });
      setBio("");
      setIsDeleteConfirmOpen(false);
      setIsDeleteAlertOpen(true);
    } catch (err) {
      console.error("Failed to delete bio:", err);
    }
  };

  return (
    <div className={styles.topInfo}>
      <div className={styles.infoContainer}>
        <div className={styles.sectionTitle}>
          Bio
          <OptionButton
            options={["Edit", "Delete"]}
            onSelect={(option) => {
              if (option === "Edit") openModalInput.current();
              else if (option === "Delete") setIsDeleteConfirmOpen(true);
            }}
            className="ml-auto"
            ariaLabel="Bio options"
          />
        </div>
        <div className={styles.sectionDescription}>{bio || "No bio set"}</div>
      </div>

      <div className={`${styles.infoContainer} ${styles.socials}`}>
        <div className={styles.sectionTitle}>
          Socials
          <OptionButton
            onSelect={() => setIsModalOpen(true)}
            className="ml-auto"
            ariaLabel="Socials options"
          />
        </div>
        <div className={styles.icons}>
          <a href="#" className={`${styles.socialIcon} fb`} title="Facebook">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className={`${styles.socialIcon} twitch`} title="Twitch">
            <i className="fab fa-twitch"></i>
          </a>
          <a href="#" className={`${styles.socialIcon} yt`} title="YouTube">
            <i className="fab fa-youtube"></i>
          </a>
        </div>
      </div>

      <div className={styles.infoContainer}>
        <div className={styles.sectionTitle}>Competitive Skill Index</div>
        <div className={styles.sectionDescription}>3789</div>
      </div>

      <ModalInput
        onSave={handleBioSave}
        title="Edit Bio"
        placeholder="Enter your new bio here"
        openModalInput={openModalInput}
      />

      <ModalAlertDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Bio?"
        message="Are you sure you want to delete your bio?"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleBioDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        type="confirm"
      />

      <ModalAlertDialog
        isOpen={isDeleteAlertOpen}
        title="Bio Deleted"
        message="Your bio has been successfully deleted."
        proceedText="OK"
        onProceed={() => setIsDeleteAlertOpen(false)}
        type="alert"
      />
    </div>
  );
};

export default TopInfo;