import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputField from "../../../components/InputFields";
import Button from "../../../components/Buttons/Button";
import Card from "../../../components/Card";
import Header from "../../../components/Header";
import MobileMenu from "../../../components/MobileMenu";
import requestAccessToken from "../../../api/requestAccessToken";
import styles from "./styles.module.css";
import CardInfo from "../../../components/Card/CardInfo.jsx";

const API_URL = import.meta.env.VITE_API_URL;

// Global cache for user profile data
let profileCache = {
  data: null,
  timestamp: null,
  timer: null
};

// Cache duration: 1 minute
const CACHE_DURATION = 60 * 1000; // 60 seconds in milliseconds

// Helper functions for cache management
const clearProfileCache = () => {
  if (profileCache.timer) {
    clearTimeout(profileCache.timer);
    profileCache.timer = null;
  }
  profileCache.data = null;
  profileCache.timestamp = null;
};

const startCacheTimer = () => {
  // Clear any existing timer
  if (profileCache.timer) {
    clearTimeout(profileCache.timer);
  }
  
  // Start new timer
  profileCache.timer = setTimeout(() => {
    clearProfileCache();
  }, CACHE_DURATION);
};

const isCacheValid = () => {
  if (!profileCache.data || !profileCache.timestamp) {
    return false;
  }
  
  const now = Date.now();
  const cacheAge = now - profileCache.timestamp;
  return cacheAge < CACHE_DURATION;
};

const saveToCache = (profileData, photosData) => {
  profileCache.data = {
    profile: profileData,
    photos: photosData
  };
  profileCache.timestamp = Date.now();
};

const loadFromCache = () => {
  if (isCacheValid()) {
    return profileCache.data;
  }
  return null;
};

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
  const [saving, setSaving] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const inputRefs = useRef({});
  
  // Store original data for comparison
  const [originalData, setOriginalData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    bio: "",
    photos: [null, null, null, null, null, null]
  });

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
    if (gender === "prefer_not_to_say") return "Other";
    return "Not specified";
  }, [gender]);

  // Get uploaded photos for preview
  const uploadedPhotos = useMemo(() => {
    return photos.filter(photo => photo !== null).map(photo => photo.preview);
  }, [photos]);

  // Function to check if data has changed
  const hasDataChanged = () => {
    // Compare basic profile data
    const basicDataChanged = 
      firstName !== originalData.firstName ||
      lastName !== originalData.lastName ||
      gender !== originalData.gender ||
      birthDate !== originalData.birthDate ||
      bio !== originalData.bio;

    // Compare photos - check if any new photos were added or existing ones were deleted
    const photosChanged = photos.some((photo, index) => {
      const originalPhoto = originalData.photos[index];
      
      // If current photo is null but original wasn't, or vice versa
      if ((photo === null) !== (originalPhoto === null)) {
        return true;
      }
      
      // If both exist, check if they're different (new upload vs existing)
      if (photo && originalPhoto) {
        // If current photo has a file (new upload) or different key
        return photo.file || photo.key !== originalPhoto.key;
      }
      
      return false;
    });

    return basicDataChanged || photosChanged;
  };

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
        newPhotos[index] = { 
          file, 
          preview: reader.result,
          isExisting: false 
        };
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

  const handlePhotoDelete = async (index) => {
    const photo = photos[index];
    if (!photo) return;

    // If it's an existing photo, delete it from the server
    if (photo.isExisting && photo.key) {
      try {
        await requestAccessToken.delete(`/photos/delete?key=${photo.key}`);
      } catch (err) {
        console.error("Error deleting photo from server:", err);
        setError("Failed to delete photo from server");
        return;
      }
    }

    // Remove from local state
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedData = loadFromCache();
        if (cachedData) {
          const { profile: userData, photos: photosData } = cachedData;
          
          const firstNameData = userData.firstName || "";
          const lastNameData = userData.lastName || "";
          const genderData = userData.gender || "";
          const birthDateData = userData.birthDate || "";
          const bioData = userData.bio || "";

          setFirstName(firstNameData);
          setLastName(lastNameData);
          setGender(genderData);
          setBirthDate(birthDateData);
          setBio(bioData);

          // Convert photo URLs to preview format and maintain order
          const photoPreviews = [null, null, null, null, null, null]; // Initialize with 6 null slots
          photosData.forEach((photo, index) => {
            if (index < 6 && photo.url) {
              // Use the order field from the database, or fallback to index
              const photoIndex = (photo.order - 1) || index;
              if (photoIndex >= 0 && photoIndex < 6) {
                photoPreviews[photoIndex] = { 
                  preview: photo.url, 
                  key: photo.key,
                  isExisting: true 
                };
              }
            }
          });
          setPhotos(photoPreviews);

          // Store original data for comparison
          setOriginalData({
            firstName: firstNameData,
            lastName: lastNameData,
            gender: genderData,
            birthDate: birthDateData,
            bio: bioData,
            photos: [...photoPreviews] // Deep copy of photos array
          });
          
          setLoading(false);
          return;
        }
        
        // Fetch from API if not in cache
        const userResponse = await requestAccessToken.get(`/user-profile`);
        const userData = userResponse.data;
        
        const firstNameData = userData.firstName || "";
        const lastNameData = userData.lastName || "";
        const genderData = userData.gender || "";
        const birthDateData = userData.birthDate || "";
        const bioData = userData.bio || "";

        setFirstName(firstNameData);
        setLastName(lastNameData);
        setGender(genderData);
        setBirthDate(birthDateData);
        setBio(bioData);

        // Fetch user photos
        const photosResponse = await requestAccessToken.get(`/photos`);
        const photosData = photosResponse.data.photos || [];
        
        // Save to cache
        saveToCache(userData, photosData);
        
        // Convert photo URLs to preview format and maintain order
        const photoPreviews = [null, null, null, null, null, null]; // Initialize with 6 null slots
        photosData.forEach((photo, index) => {
          if (index < 6 && photo.url) {
            // Use the order field from the database, or fallback to index
            const photoIndex = (photo.order - 1) || index;
            if (photoIndex >= 0 && photoIndex < 6) {
              photoPreviews[photoIndex] = { 
                preview: photo.url, 
                key: photo.key,
                isExisting: true 
              };
            }
          }
        });
        setPhotos(photoPreviews);

        // Store original data for comparison
        setOriginalData({
          firstName: firstNameData,
          lastName: lastNameData,
          gender: genderData,
          birthDate: birthDateData,
          bio: bioData,
          photos: [...photoPreviews] // Deep copy of photos array
        });
        
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Cleanup effect - start timer when component unmounts
  useEffect(() => {
    // Clear any existing timer when component mounts
    if (profileCache.timer) {
      clearTimeout(profileCache.timer);
      profileCache.timer = null;
    }
    
    return () => {
      // Start the cache timer when user leaves the profile page
      if (profileCache.data) {
        startCacheTimer();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");

    // Check if data has changed
    if (!hasDataChanged()) {
      setError("No changes detected. Profile is already up to date.");
      return;
    }

    // Validate all fields
    const results = await Promise.all(
      Object.values(inputRefs.current).map((ref) => ref.validate())
    );
    const isValid = results.every((valid) => valid);

    if (!isValid) {
      return;
    }

    setSaving(true);

    try {
      // Update user profile data
      const [year, month, day] = birthDate ? birthDate.split("-") : ["", "", ""];
      
      const profileResponse = await requestAccessToken.put('/user-profile', {
        firstName,
        lastName,
        gender,
        month,
        day,
        year,
        bio
      });

      // If server indicates no changes, show message and return early
      if (profileResponse.data.noChanges) {
        setError("No changes detected. Profile is already up to date.");
        return;
      }

      // Upload photos if any new ones were added or existing ones were modified
      const newPhotos = photos.filter(photo => photo !== null && photo.file && !photo.isExisting);
      const hasPhotoChanges = photos.some((photo, index) => {
        const originalPhoto = originalData.photos[index];
        
        // If one is null and the other isn't, there's a change
        if ((photo === null) !== (originalPhoto === null)) {
          return true;
        }
        
        // If both are null, no change
        if (photo === null && originalPhoto === null) {
          return false;
        }
        
        // If both exist, compare their keys and file status
        if (photo && originalPhoto) {
          // If current photo has a file (new upload), it's a change
          if (photo.file) {
            return true;
          }
          // If keys are different, it's a change
          if (photo.key !== originalPhoto.key) {
            return true;
          }
        }
        
        return false;
      });

      if (hasPhotoChanges) {
        try {
          const formData = new FormData();
          
          // Get userId from cookie
          const userIdFromCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('userId='))
            ?.split('=')[1];
          
          if (!userIdFromCookie) {
            setError("User not authenticated");
            return;
          }
          
          formData.append('userId', userIdFromCookie);
          
          // Send the complete photos array as JSON to preserve existing photos
          formData.append('photosData', JSON.stringify(photos.map((photo, index) => ({
            index,
            isNew: photo && photo.file && !photo.isExisting,
            isDeleted: photo === null,
            key: photo && photo.key ? photo.key : null
          }))));
          
          // Append only new photo files to FormData
          newPhotos.forEach((photoObj) => {
            if (photoObj && photoObj.file) {
              formData.append('photos', photoObj.file);
            }
          });

          // Upload photos to S3
          await axios.post(
            `${API_URL}/api/profile/photos/upload-multiple`,
            formData,
            { 
              withCredentials: true,
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
        } catch (photoErr) {
          console.error("⚠️ Photo upload failed:", photoErr);
          
          // Show specific error message based on error type
          if (photoErr.response?.data?.error === "FILE_TOO_LARGE") {
            setError("One or more photos are too large. Please choose files smaller than 10MB each.");
          } else if (photoErr.response?.data?.error === "TOO_MANY_FILES") {
            setError("Too many photos selected. Maximum 6 photos allowed.");
          } else {
            setError("Profile updated but photo upload failed. Please try uploading photos again.");
          }
          return;
        }
      }
      
      // Update original data to reflect the saved state
      setOriginalData({
        firstName,
        lastName,
        gender,
        birthDate,
        bio,
        photos: [...photos] // Deep copy of current photos
      });
      
      // Clear cache since data has been updated
      clearProfileCache();
      
      setSuccess("Profile updated successfully!");
      
    } catch (err) {
      console.error("API error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || "Profile update failed");
    } finally {
      setSaving(false);
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

  // Show edit form for own profile
  return (
    <div className={styles.profilePage}>
                  <Header title="Edit Profile" className={styles.profileHeader} />
      <div className={styles.containerAccess}>
        {/* Left Container - Preview Card */}
        <div className={styles.leftContainer}>
        <div className={styles.previewCard}>
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
            <CardInfo 
              name={displayName}
              age={age}
              gender={gender}
              distance={0}
              bio={bio}
              classNames={{
                nameAge: styles.nameAge,
                category: styles.category,
                distance: styles.distance,
                bioPreview: styles.bioPreview,
              }}
            />
          </Card>
        </div>
      </div>

      {/* Right Container - Input Fields and Photos */}
      <div className={styles.rightContainer}>
        <div className={styles.formSection}>
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
                    { value: "prefer_not_to_say", label: "Other" },
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
                  placeholder="yyyy-mm-dd"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  min="1900-01-01"
                  max="2024-12-31"
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
                <div className={styles.photoUploadInfo}>
                  <p>Upload photos (max 10MB each)</p>
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

              {/* Actions Container - Button */}
              <div className={styles.actionsContainer}>
                <div className={styles.buttonSection}>
                  {error && <span className={styles.errorMessage}>{error}</span>}
                  {success && <span className={styles.successMessage}>{success}</span>}
                  <Button type="secondary" position="center" htmlType="submit" loading={saving}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      </div>
      <MobileMenu />
    </div>
  );
}

export default Profile;
