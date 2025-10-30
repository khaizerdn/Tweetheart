import React, { useState } from "react";
import axios from "axios";
import styles from "./styles.module.css";

const API_URL = import.meta.env.VITE_API_URL;

function LocationPermission({ onLocationGranted }) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState("");

  const getLocationAndSave = async () => {
    setIsRequesting(true);
    setError("");

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Save location to database
            const response = await axios.post(
              `${API_URL}/update-location`,
              { latitude, longitude },
              { withCredentials: true }
            );

            if (response.status === 200) {
              onLocationGranted();
            }
          } catch (err) {
            console.error("Error saving location:", err);
            setError(err.response?.data?.message || "Failed to save location. Please try again.");
            setIsRequesting(false);
          }
        },
        (err) => {
          console.error("Error getting location:", err);
          let errorMessage = "Failed to get location. ";
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage += "Please enable location access in your browser settings.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case err.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
              break;
          }
          
          setError(errorMessage);
          setIsRequesting(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An error occurred. Please try again.");
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    // Allow user to skip for now, but they'll need it later for matches
    onLocationGranted();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Location Access Required</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <p>
            To help you find matches nearby, we need access to your location. 
            This allows us to show you people in your area and improve your experience.
          </p>
          {error && <div className={styles.error}>{error}</div>}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.skipButton}
            onClick={handleSkip}
            disabled={isRequesting}
          >
            Skip for Now
          </button>
          <button
            className={styles.allowButton}
            onClick={getLocationAndSave}
            disabled={isRequesting}
          >
            {isRequesting ? "Getting Location..." : "Allow Location"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationPermission;

