import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../../components/InputFields";
import Button from "../../../components/Buttons/Button";
import Card from "../../../components/Card";
import requestAccessToken from "../../../api/requestAccessToken";
import styles from "./styles.module.css";

const API_URL = import.meta.env.VITE_API_URL;

function Profile() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState([null, null, null, null, null, null]); // 6 photo slots
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
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

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch basic user info
        const userResponse = await requestAccessToken.get('/user-profile');
        const userData = userResponse.data;
        
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setGender(userData.gender || "");
        setBirthDate(userData.birthDate || "");
        setBio(userData.bio || "");

        // Fetch user photos
        const photosResponse = await requestAccessToken.get('/api/photos');
        const photosData = photosResponse.data.photos || [];
        
        // Convert photo URLs to preview format
        const photoPreviews = [...photos];
        photosData.forEach((photo, index) => {
          if (index < 6 && photo.url) {
            photoPreviews[index] = { preview: photo.url };
          }
        });
        setPhotos(photoPreviews);
        
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");

    // Validate all fields
    const results = await Promise.all(
      Object.values(inputRefs.current).map((ref) => ref.validate())
    );
    const isValid = results.every((valid) => valid);

    if (!isValid) {
      return;
    }

    try {
      // Update user profile data
      const [year, month, day] = birthDate ? birthDate.split("-") : ["", "", ""];
      
      await requestAccessToken.put('/user-profile', {
        firstName,
        lastName,
        gender,
        month,
        day,
        year,
        bio
      });

      // Upload photos if any new ones were added
      const uploadedPhotos = photos.filter(photo => photo !== null && photo.file);
      if (uploadedPhotos.length > 0) {
        try {
          const formData = new FormData();
          
          // Append all photo files to FormData
          uploadedPhotos.forEach((photoObj) => {
            if (photoObj && photoObj.file) {
              formData.append('photos', photoObj.file);
            }
          });

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
          console.error("⚠️ Photo upload failed:", photoErr);
          setError("Profile updated but photo upload failed. Please try uploading photos again.");
          return;
        }
      }
      
      setSuccess("Profile updated successfully!");
      
    } catch (err) {
      console.error("API error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || "Profile update failed");
    }
  };

  if (loading) {
    return (
      <div className={styles.containerAccess}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingMessage}>Loading profile...</div>
        </div>
      </div>
    );
  }

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
          <h1>Edit Profile</h1>
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

              {/* Actions Container - Button */}
              <div className={styles.actionsContainer}>
                <div className={styles.buttonSection}>
                  {error && <span className={styles.errorMessage}>{error}</span>}
                  {success && <span className={styles.successMessage}>{success}</span>}
                  <Button type="secondary" position="center" htmlType="submit">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
