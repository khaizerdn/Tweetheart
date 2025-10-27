import React, { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../components/InputFields";
import Button from "../../components/Buttons/Button";
import styles from "./styles.module.css";

const API_URL = import.meta.env.VITE_API_URL;

function SignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState([null, null, null, null, null, null]); // 6 photo slots
  const [error, setError] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const inputRefs = useRef({});

  // Calculate age from birth date
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;
    const birth = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);

  // Get display name
  const displayName = useMemo(() => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    return "Your Name";
  }, [firstName, lastName]);

  // Get display gender
  const displayGender = useMemo(() => {
    if (!gender) return "Not specified";
    if (gender === "male") return "Male";
    if (gender === "female") return "Female";
    return "Prefer not to say";
  }, [gender]);

  // Get uploaded photos for preview
  const uploadedPhotos = useMemo(() => {
    return photos.filter(photo => photo !== null).map(photo => photo.preview);
  }, [photos]);

  const nextPhoto = () => {
    if (uploadedPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % uploadedPhotos.length);
    }
  };

  const prevPhoto = () => {
    if (uploadedPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => prev === 0 ? uploadedPhotos.length - 1 : prev - 1);
    }
  };

  // Reset photo index when photos change
  useEffect(() => {
    if (currentPhotoIndex >= uploadedPhotos.length && uploadedPhotos.length > 0) {
      setCurrentPhotoIndex(uploadedPhotos.length - 1);
    } else if (uploadedPhotos.length === 0) {
      setCurrentPhotoIndex(0);
    }
  }, [uploadedPhotos.length, currentPhotoIndex]);

  const handlePhotoUpload = (index, event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...photos];
        newPhotos[index] = { file, preview: reader.result };
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoDelete = (index) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };

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

    // Check if at least 2 photos are uploaded
    const uploadedPhotos = photos.filter(photo => photo !== null);
    if (uploadedPhotos.length < 2) {
      setError("Please upload at least 2 photos");
      return;
    }
    
    const [year, month, day] = birthDate ? birthDate.split("-") : ["", "", ""];
    try {
      // Step 1: Create user account
      const res = await axios.post(
        `${API_URL}/signup`,
        { firstName, lastName, email, password, gender, month, day, year, bio },
        { withCredentials: true }
      );
      
      sessionStorage.setItem("email", email);
      
      // Step 2: Upload photos to S3 if account creation was successful
      if (res.data.success && res.data.userId) {
        try {
          const formData = new FormData();
          
          // Append all photo files to FormData
          uploadedPhotos.forEach((photoObj) => {
            if (photoObj && photoObj.file) {
              formData.append('photos', photoObj.file);
            }
          });
          
          formData.append('userId', res.data.userId);

          // Upload photos to S3
          await axios.post(
            `${API_URL}/api/photos/upload-multiple`,
            formData,
            { 
              withCredentials: true,
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          console.log("✅ Photos uploaded successfully to S3");
        } catch (photoErr) {
          console.error("⚠️ Photo upload failed (account created):", photoErr);
          // Don't block navigation - photos can be added later
        }
      }
      
      // Navigate to verification page
      navigate("/verification");
      
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
      {/* Left Container - Preview Card */}
      <div className={styles.leftContainer}>
        <div className={styles.previewCard}>
          <div className={styles.previewLabel}>Preview</div>
          <div className={styles.card}>
            <div className={styles.photoContainer}>
              {uploadedPhotos.length > 0 ? (
                <>
                  <img 
                    src={uploadedPhotos[currentPhotoIndex]} 
                    alt="Preview" 
                    className={styles.photo}
                  />
                  
                  {/* Photo indicators */}
                  {uploadedPhotos.length > 1 && (
                    <div className={styles.photoIndicators}>
                      {uploadedPhotos.map((_, photoIndex) => (
                        <div
                          key={photoIndex}
                          className={`${styles.indicator} ${photoIndex === currentPhotoIndex ? styles.active : ''}`}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Photo navigation buttons */}
                  {uploadedPhotos.length > 1 && (
                    <>
                      <button
                        className={`${styles.navButton} ${styles.prevButton}`}
                        onClick={prevPhoto}
                        type="button"
                      >
                        <i className="fa fa-chevron-left"></i>
                      </button>
                      <button
                        className={`${styles.navButton} ${styles.nextButton}`}
                        onClick={nextPhoto}
                        type="button"
                      >
                        <i className="fa fa-chevron-right"></i>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className={styles.placeholderPhoto}>
                  <i className="fa fa-user"></i>
                  <p>Upload photos to see preview</p>
                </div>
              )}
            </div>
            
            <div className={styles.cardInfo}>
              <div className={styles.nameAge}>
                <h3>
                  {displayName}
                  {age && `, ${age}`}
                </h3>
                <div className={styles.category}>
                  <i className="fa fa-venus-mars"></i>
                  <span>{displayGender}</span>
                </div>
              </div>
              
              {bio && (
                <div className={styles.bioPreview}>
                  {bio}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Container - Input Fields and Photos */}
      <div className={styles.rightContainer}>
        <div className={styles.formSection}>
          <h1>Sign Up</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.formContent}>
              {/* Input Fields Section */}
              <div className={styles.inputFieldsSection}>
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
                  ref={(el) => (inputRefs.current.bio = el)}
                  type="textarea"
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  max={500}
                  required={false}
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
              </div>

              {/* Photo Upload Section */}
              <div className={styles.photoSection}>
                <div className={styles.photoGrid}>
                  {photos.map((photo, index) => (
                    <div key={index} className={styles.photoCard}>
                      {photo ? (
                        <div className={styles.photoPreview}>
                          <img src={photo.preview} alt={`Upload ${index + 1}`} />
                          <div 
                            className={styles.photoOverlay}
                            onClick={() => handlePhotoDelete(index)}
                          >
                            <i className="fa-solid fa-trash"></i>
                            <span>Delete</span>
                          </div>
                        </div>
                      ) : (
                        <label className={styles.photoUpload}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(index, e)}
                            style={{ display: 'none' }}
                          />
                          <i className="fa-solid fa-plus"></i>
                          <span>Add Photo</span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Container - Button, Terms, HR, Account Link */}
              <div className={styles.actionsContainer}>
                <div className={styles.buttonSection}>
                  {error && <span className={styles.errorMessage}>{error}</span>}
                  <Button type="secondary" position="center" htmlType="submit">
                    Confirm
                  </Button>
                </div>

                <div className={styles.termsSection}>
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
                </div>

                <div className={styles.hrSection}>
                  <hr />
                </div>

                <div className={styles.accountLinkSection}>
                  <p>
                    <Link to="/" className={styles.buttonRegisterText}>
                      Already have an account?
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;