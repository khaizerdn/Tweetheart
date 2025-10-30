import React, { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../components/InputFields";
import Button from "../../components/Buttons/Button";
import Card from "../../components/Card";
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
  
  // Location state
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [isLocationLoading, setIsLocationLoading] = useState(false);

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

  // Capture user location on component mount
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser");
        return;
      }

      setIsLocationLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationError("");
          setIsLocationLoading(false);
        },
        (error) => {
          setIsLocationLoading(false);
          switch(error.code) {
            case error.PERMISSION_DENIED:
              setLocationError("Location access denied. Please enable location to create an account.");
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              setLocationError("Location request timed out.");
              break;
            default:
              setLocationError("An unknown error occurred while getting location.");
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    getLocation();
  }, []);

  const handlePhotoUpload = (index, event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Check file size (10MB limit to match server)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Please choose a file smaller than 10MB.`);
        // Clear the input so user can try again
        event.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...photos];
        newPhotos[index] = { file, preview: reader.result };
        setPhotos(newPhotos);
        // Clear any previous error when successful upload
        if (error && error.includes('too large')) {
          setError('');
        }
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setError('Please select a valid image file.');
      event.target.value = '';
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

    // Validate location is captured
    if (!latitude || !longitude) {
      setError("Location access is required to create an account. Please enable location services.");
      return;
    }

    // Navigate to verification page
    navigate("/verification");
    
    const [year, month, day] = birthDate ? birthDate.split("-") : ["", "", ""];
    try {
      // Step 1: Create user account
      const res = await axios.post(
        `${API_URL}/signup`,
        { firstName, lastName, email, password, gender, month, day, year, bio, latitude, longitude },
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
            `${API_URL}/api/signup/photos/upload-multiple`,
            formData,
            { 
              withCredentials: true,
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
        } catch (photoErr) {
          console.error("⚠️ Photo upload failed (account created):", photoErr);
          
          // Show specific error message based on error type
          if (photoErr.response?.data?.error === "FILE_TOO_LARGE") {
            setError("One or more photos are too large. Please choose files smaller than 10MB each.");
          } else if (photoErr.response?.data?.error === "TOO_MANY_FILES") {
            setError("Too many photos selected. Maximum 6 photos allowed.");
          } else {
            setError("Photo upload failed. You can add photos later in your profile.");
          }
          // Don't block navigation - photos can be added later
        }
      }
      
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
          <Card
            photos={uploadedPhotos}
            currentPhotoIndex={currentPhotoIndex}
            onNextPhoto={nextPhoto}
            onPrevPhoto={prevPhoto}
            placeholder={
              <div className={styles.placeholderPhoto}>
                <i className="fa fa-user"></i>
                <p>Upload photos to see preview</p>
              </div>
            }
          >
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
          </Card>
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

              {/* Location Status Section */}
              <div className={styles.locationSection}>
                <div className={styles.locationStatus}>
                  <div className={styles.locationHeader}>
                    <i className={`fa-solid ${latitude && longitude ? 'fa-location-dot' : 'fa-location-crosshairs'}`}></i>
                    <span>Location Services</span>
                  </div>
                  {isLocationLoading && (
                    <div className={styles.locationLoading}>
                      <i className="fa fa-spinner fa-spin"></i>
                      <span>Getting your location...</span>
                    </div>
                  )}
                  {!isLocationLoading && latitude && longitude && (
                    <div className={styles.locationSuccess}>
                      <i className="fa-solid fa-check-circle"></i>
                      <span>Location captured successfully</span>
                    </div>
                  )}
                  {!isLocationLoading && locationError && (
                    <div className={styles.locationError}>
                      <i className="fa-solid fa-exclamation-circle"></i>
                      <span>{locationError}</span>
                    </div>
                  )}
                  {!isLocationLoading && !latitude && !longitude && !locationError && (
                    <div className={styles.locationNeutral}>
                      <span>Waiting for location access...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className={styles.photoSection}>
                <div className={styles.photoUploadInfo}>
                  <p>Upload 2-6 photos (max 10MB each)</p>
                </div>
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