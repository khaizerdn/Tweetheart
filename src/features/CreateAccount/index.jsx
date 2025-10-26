import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../components/InputFields";
import Button from "../../components/Buttons/Button";
import styles from "./styles.module.css";

const API_URL = import.meta.env.VITE_API_URL;

function CreateAccount() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const results = await Promise.all(
      Object.values(inputRefs.current).map((ref) => ref.validate())
    );
    const isValid = results.every((valid) => valid);

    if (!isValid) {
      return;
    }

    navigate("/verification");
    
    const [year, month, day] = birthDate ? birthDate.split("-") : ["", "", ""];
    try {
      const res = await axios.post(
        `${API_URL}/createaccount`,
        { firstName, lastName, username, email, password, gender, month, day, year },
        { withCredentials: true }
      );
      sessionStorage.setItem("email", email);
    } catch (err) {
      console.error("API error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
      });
      setError(err.response?.data?.message || "Account creation failed");
    }
  };

  return (
    <div className={styles.containerAccess}>
      <div className={styles.loginSection}>
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <InputField
            ref={(el) => (inputRefs.current.firstName = el)}
            type="firstname"
            label="First Name"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required={true}
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
            ref={(el) => (inputRefs.current.lastName = el)}
            type="lastname"
            label="Last Name"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required={true}
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
            ref={(el) => (inputRefs.current.gender = el)}
            type="select"
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "prefer_not_to_say", label: "Prefer not to say" },
            ]}
            required={true}
            styles={{
              backgroundOption: 'var(--background-color-2)',
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
            ref={(el) => (inputRefs.current.birthDate = el)}
            type="date"
            label="Birth Date"
            placeholder="mm/dd/yyyy"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            min="01/01/1900"
            max="present"
            required={true}
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
            ref={(el) => (inputRefs.current.username = el)}
            type="checkusername"
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required={true}
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
            ref={(el) => (inputRefs.current.email = el)}
            type="checkemail"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={true}
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
            ref={(el) => (inputRefs.current.password = el)}
            type="createpassword"
            label="Password"
            placeholder="Create your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={true}
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
            ref={(el) => (inputRefs.current.confirmPassword = el)}
            type="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            confirmPassword={password}
            required={true}
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
          {error && <span className={styles.errorMessage}>{error}</span>}
          <Button type="secondary" position="center" htmlType="submit">
            Create Account
          </Button>
        </form>
        <p>
          By creating an account, you agree to the{" "}
          <Link to="/terms-of-service" className={styles.buttonRegisterText}>
            Terms of Service
          </Link>
          ,{" "}
          <Link to="/privacy-policy" className={styles.buttonRegisterText}>
            Privacy Policy
          </Link>
          , including{" "}
          <Link to="/cookies-policy" className={styles.buttonRegisterText}>
            Cookie Policy
          </Link>
          .
        </p>
        <hr />
        <p>
          <Link to="/" className={styles.buttonRegisterText}>
            Already have an account?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default CreateAccount;