import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../components/InputFields";
import Button from "../../components/Buttons/Button";
import styles from "./styles.module.css";

const API_URL = import.meta.env.VITE_API_URL;

function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/login`,
        { email, password },
        { withCredentials: true }
      );
      setIsLoggedIn(true);
      navigate("/");
    } catch (err) {
      const message = err.response?.status === 429
        ? "Too many login attempts. Please try again later."
        : err.response?.data?.message || "Login failed";
      setError(message);
    }
  };

  return (
    <div className={styles.containerAccess}>
      <div className={styles.loginSection}>
        <h1>gamify.com</h1>
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
          {error && <span className={styles.errorMessage}>{error}</span>}
          <Button type="secondary" position="center" htmlType="submit">Log In</Button>
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