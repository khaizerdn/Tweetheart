import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/Card";
import MobileMenu from "../../../components/MobileMenu";
import requestAccessToken from "../../../api/requestAccessToken";
import styles from "./styles.module.css";

function OtherProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState([null, null, null, null, null, null]); // 6 photo slots
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  console.log('OtherProfile - Component mounted with userId:', userId);

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
    return "Unknown User";
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

  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('OtherProfile - Fetching data for userId:', userId);
        setLoading(true);
        
        // Fetch from API
        console.log('OtherProfile - Making API call to /user-profile/${userId}');
        const userResponse = await requestAccessToken.get(`/user-profile/${userId}`);
        console.log('OtherProfile - User response:', userResponse.data);
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
        console.log('OtherProfile - Making API call to /api/photos/${userId}');
        const photosResponse = await requestAccessToken.get(`/api/photos/${userId}`);
        console.log('OtherProfile - Photos response:', photosResponse.data);
        const photosData = photosResponse.data.photos || [];
        
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
        
      } catch (err) {
        console.error("OtherProfile - Error fetching user data:", err);
        console.error("OtherProfile - Error details:", err.response?.data);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  try {
    if (loading) {
      return (
        <div className={styles.containerAccess}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingMessage}>Loading profile...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.containerAccess}>
          <div className={styles.loadingContainer}>
            <div className={styles.errorMessage}>{error}</div>
          </div>
        </div>
      );
    }

    console.log('OtherProfile - Rendering profile for:', displayName, 'with', uploadedPhotos.length, 'photos');

    return (
      <div className={styles.profilePage}>
        <div className={styles.containerAccess}>
          {/* Center Container - Preview Card Only */}
          <div className={styles.centerContainer}>
            <div className={styles.previewCard}>
              <Card
                photos={uploadedPhotos}
                currentPhotoIndex={currentPhotoIndex}
                onNextPhoto={nextPhoto}
                onPrevPhoto={prevPhoto}
                placeholder={
                  <div className={styles.placeholderPhoto}>
                    <i className="fa fa-user"></i>
                    <p>No photos available</p>
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
        </div>
        <MobileMenu />
      </div>
    );
  } catch (renderError) {
    console.error('OtherProfile - Render error:', renderError);
    return (
      <div className={styles.containerAccess}>
        <div className={styles.loadingContainer}>
          <div className={styles.errorMessage}>Error rendering profile: {renderError.message}</div>
        </div>
      </div>
    );
  }
}

export default OtherProfile;
