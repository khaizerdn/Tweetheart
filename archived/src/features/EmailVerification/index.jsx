import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import InputField from "../../components/InputFields";
import Button from "../../components/Buttons/Button";
import styles from "./styles.module.css";

const API_URL = import.meta.env.VITE_API_URL;
const COUNTDOWN_KEY = 'verification_countdown';

function Verification({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  // Restore countdown from sessionStorage on mount
  useEffect(() => {
    const savedCountdown = sessionStorage.getItem(COUNTDOWN_KEY);
    if (savedCountdown) {
      const remainingTime = parseInt(savedCountdown);
      setCountdown(remainingTime);
      setIsResendEnabled(remainingTime <= 0);
    }
  }, []);

  // Save countdown to sessionStorage
  const saveCountdownToStorage = (time) => {
    sessionStorage.setItem(COUNTDOWN_KEY, time.toString());
  };

  // Clear countdown from sessionStorage
  const clearSessionStorage = () => {
    sessionStorage.removeItem(COUNTDOWN_KEY);
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0 && !isResendEnabled) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsResendEnabled(true);
            clearSessionStorage();
          }
          saveCountdownToStorage(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [countdown, isResendEnabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = sessionStorage.getItem("email");
    if (!email) {
      setError("No email found. Please restart the process.");
      return;
    }

    const isValid = await inputRef.current.validate();
    if (!isValid) {
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/verify-account`, {
        email,
        verificationCode,
      }, { withCredentials: true });
      
      // Backend automatically logs in user and sets cookies
      // Update login state and navigate to home page
      if (res.data.success) {
        sessionStorage.removeItem("email");
        clearSessionStorage();
        
        // Set logged in state
        if (setIsLoggedIn) {
          setIsLoggedIn(true);
        }
        
        // Navigate to home page
        navigate("/");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Incorrect verification code.";
      setError(errorMessage);
    }
  };

  const handleResendCode = async () => {
    if (!isResendEnabled) return;
    const email = sessionStorage.getItem("email");
    if (!email) {
      setError("No email found. Please restart the process.");
      return;
    }

    setCountdown(60);
    setIsResendEnabled(false);
    saveCountdownToStorage(60);

    try {
      await axios.post(`${API_URL}/resend-code`, { email });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Error resending code.");
    }
  };

  return (
    <div className={styles.containerAccess}>
      <div className={styles.verificationSection}>
        <h1>Verification</h1>
        <form onSubmit={handleSubmit}>
          <InputField
            ref={inputRef}
            type="text"
            label="Verification Code"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => {
              setVerificationCode(e.target.value);
              setError("");
            }}
            required={true}
            errorOverride={error}
            styles={{
              background: 'var(--background-color-1)',
              disabled: 'var(--background-color-primary-disabled-1)',
              muted: 'var(--background-color-primary-muted-1)',
              default: 'var(--background-color-primary-default-1)',
              hover: 'var(--background-color-primary-hover-1)',
              active: 'var(--background-color-primary-active-1)',
              selected: 'var(--background-color-primary-selected-1)',
            }}
          />
          <Button type="secondary" position="center" htmlType="submit">
            Confirm
          </Button>
        </form>
        <p className={styles.note}>
          Please check your email for the verification code.
        </p>
        <hr />
        <p
          className={`${styles.resendLink} ${
            isResendEnabled ? "" : styles.disabled
          }`}
          onClick={handleResendCode}
        >
          {isResendEnabled
            ? "Resend Code?"
            : `Resend Code? (Wait ${countdown}s)`}
        </p>
      </div>
    </div>
  );
}

export default Verification;