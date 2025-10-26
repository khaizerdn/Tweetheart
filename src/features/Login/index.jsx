import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../components/InputFields";
import Button from "../../components/Buttons/Button";
import styles from "./styles.module.css";
import logoHorizontal from "../../utils/assets/logo_horizontal.svg";

const API_URL = import.meta.env.VITE_API_URL;

function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    
    // Local validation - check for empty credentials
    if (!email.trim() || !password.trim()) {
      setError("Incorrect email or password.");
      return;
    }
    
    // Only make API request if validation passes
    try {
      const res = await axios.post(
        `${API_URL}/login`,
        { email: email.trim(), password },
        { withCredentials: true }
      );
      setIsLoggedIn(true);
      navigate("/");
    } catch (err) {
      let message;
      if (err.response?.status === 429) {
        const remainingSeconds = err.response?.data?.remainingSeconds;
        if (remainingSeconds) {
          setCountdown(remainingSeconds);
          message = `Try again in ${remainingSeconds}s`;
        } else {
          message = "Too many attempts. Try again later.";
        }
      } else {
        message = err.response?.data?.message || "Login failed";
        // Clear countdown on successful login attempts with different credentials
        setCountdown(0);
      }
      setError(message);
    }
  };

  return (
    <div className={styles.containerAccess}>
      <div className={styles.loginSection}>
        <div className={styles.logoContainer}>
          <img 
            src={logoHorizontal} 
            alt="Logo" 
            className={styles.logo}
          />
        </div>
        <form onSubmit={handleSubmit}>
          <InputField
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            styles={{
              background: 'var(--background-color-1)',
              disabled: 'var(--background-color-primary-disabled-1)',
              muted: 'var(--background-color-primary-muted-1)',
              default: 'var(--background-color-primary-default-1)',
              hover: 'var(--background-color-primary-hover-1)',
              active: 'var(--background-color-primary-active-1)',
              selected: 'var(--background-color-primary-selected-1)'
            }}
          />
          <InputField
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            styles={{
              background: 'var(--background-color-1)',
              disabled: 'var(--background-color-primary-disabled-1)',
              muted: 'var(--background-color-primary-muted-1)',
              default: 'var(--background-color-primary-default-1)',
              hover: 'var(--background-color-primary-hover-1)',
              active: 'var(--background-color-primary-active-1)',
              selected: 'var(--background-color-primary-selected-1)'
            }}
          />
          {error && (
            <span className={styles.errorMessage}>
              {countdown > 0 ? `Try again in ${countdown}s` : error}
            </span>
          )}
          <Button 
            type="secondary" 
            position="center" 
            htmlType="submit"
          >
            Log In
          </Button>
        </form>
        <p>
          <Link to="/forgotpassword" className={styles.buttonRegisterText}>
            Forgot Password?
          </Link>
        </p>
        <hr />
        <p>
          <Link to="/createaccount" className={styles.buttonRegisterText}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;