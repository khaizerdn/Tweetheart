import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import InputField from "../../components/InputFields";
import Button from "../../components/Buttons/Button";
import styles from "./styles.module.css";

const API_URL = import.meta.env.VITE_API_URL;

function ForgotPassword() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    email: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const emailRef = useRef(null);
  const codeRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const isValid = await emailRef.current.validate();
    if (!isValid) {
      setErrors({ email: "Email is required or invalid." });
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/check-email`, {
        email: values.email,
      });
      if (res.data.success) {
        setErrors({});
        setStep(2);
      }
    } catch (err) {
      setErrors({
        email: err.response?.data?.message || "This email is not registered.",
      });
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const isValid = await codeRef.current.validate();
    if (!isValid) {
      setErrors({ verificationCode: "Verification code is invalid." });
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/fp-verifycode`, {
        email: values.email,
        verificationCode: values.verificationCode,
      });
      if (res.data.success) {
        setErrors({});
        setStep(3);
      }
    } catch (err) {
      setErrors({
        verificationCode:
          err.response?.data?.message || "Incorrect verification code.",
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const isPasswordValid = await passwordRef.current.validate();
    const isConfirmPasswordValid = await confirmPasswordRef.current.validate();
    if (!isPasswordValid || !isConfirmPasswordValid) {
      setErrors({
        password: !isPasswordValid ? "Password is required or invalid." : "",
        confirmPassword: !isConfirmPasswordValid
          ? "Confirm password is required or does not match."
          : "",
      });
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/reset-password`, {
        email: values.email,
        password: values.password,
      });
      if (res.data.success) {
        setErrors({});
        navigate("/login");
      }
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Failed to reset password.",
      });
    }
  };

  return (
    <div className={styles.containerAccess}>
      <div className={styles.verificationSection}>
        {step === 1 && (
          <>
            <h1>Forgot Password</h1>
            <form onSubmit={handleEmailSubmit} autoComplete="off">
              <InputField
                ref={emailRef}
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={values.email}
                onChange={(e) => {
                  setValues({ ...values, email: e.target.value });
                  setErrors({ ...errors, email: "" });
                }}
                required={true}
                errorOverride={errors.email}
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
                Search
              </Button>
              <p className={styles.note}>
                Please enter your email to search for your account.
              </p>
              <hr />
              <p className={styles.resendLink}>
                <Link to="/login">Remember your password?</Link>
              </p>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Verify Code</h1>
            <form onSubmit={handleCodeSubmit} autoComplete="off">
              <InputField
                ref={codeRef}
                type="text"
                label="Verification Code"
                placeholder="Enter verification code"
                value={values.verificationCode}
                onChange={(e) => {
                  setValues({ ...values, verificationCode: e.target.value });
                  setErrors({ ...errors, verificationCode: "" });
                }}
                required={true}
                errorOverride={errors.verificationCode}
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
            <p className={styles.resendLink}>
              <Link to="/login">Remember your password?</Link>
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Create New Password</h1>
            <form onSubmit={handlePasswordSubmit} autoComplete="off">
              <InputField
                ref={passwordRef}
                type="createpassword"
                label="Password"
                placeholder="Enter new password"
                value={values.password}
                onChange={(e) => {
                  setValues({ ...values, password: e.target.value });
                  setErrors({ ...errors, password: "" });
                }}
                required={true}
                errorOverride={errors.password}
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
              <InputField
                ref={confirmPasswordRef}
                type="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm new password"
                value={values.confirmPassword}
                onChange={(e) => {
                  setValues({ ...values, confirmPassword: e.target.value });
                  setErrors({ ...errors, confirmPassword: "" });
                }}
                required={true}
                confirmPassword={values.password}
                errorOverride={errors.confirmPassword}
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
              <p className={styles.note}>Please create your new password.</p>
              <hr />
              <p className={styles.resendLink}>
                <Link to="/login">Remember your password?</Link>
              </p>
            </form>
          </>
        )}

        {errors.general && <p className={styles.note}>{errors.general}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;