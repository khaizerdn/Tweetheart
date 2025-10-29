import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import styles from './styles.module.css';

const FilterContainer = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  onResetFilters 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
    setHasChanges(false);
  }, [filters, isOpen]);

  const handleFilterChange = (filterType, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setHasChanges(true);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters(localFilters);
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaultFilters = {
      ageRange: { min: 18, max: 65 },
      distance: 50,
      interests: [],
      lifestyle: [],
      education: 'any',
      relationshipType: 'any',
      height: { min: 140, max: 200 },
      hasPhotos: true,
      onlineNow: false
    };
    setLocalFilters(defaultFilters);
    onResetFilters();
    setHasChanges(true);
  };

  const handleClose = () => {
    if (hasChanges) {
      // Revert to original filters
      setLocalFilters(filters);
      setHasChanges(false);
    }
    onClose();
  };

  const interestOptions = [
    'Travel', 'Fitness', 'Music', 'Art', 'Food', 'Sports', 'Movies', 'Books',
    'Photography', 'Dancing', 'Cooking', 'Gaming', 'Nature', 'Technology',
    'Fashion', 'Pets', 'Yoga', 'Wine', 'Coffee', 'Adventure'
  ];

  const lifestyleOptions = [
    'Non-smoker', 'Social drinker', 'Teetotaler', 'Vegan', 'Vegetarian',
    'Gluten-free', 'Early bird', 'Night owl', 'Homebody', 'Social butterfly',
    'Fitness enthusiast', 'Couch potato', 'Minimalist', 'Collector'
  ];

  const educationOptions = [
    { value: 'any', label: 'Any' },
    { value: 'high-school', label: 'High School' },
    { value: 'some-college', label: 'Some College' },
    { value: 'bachelors', label: 'Bachelor\'s Degree' },
    { value: 'masters', label: 'Master\'s Degree' },
    { value: 'phd', label: 'PhD' },
    { value: 'other', label: 'Other' }
  ];

  const relationshipOptions = [
    { value: 'any', label: 'Any' },
    { value: 'casual', label: 'Casual Dating' },
    { value: 'serious', label: 'Serious Relationship' },
    { value: 'marriage', label: 'Marriage' },
    { value: 'friendship', label: 'Friendship' }
  ];

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={handleClose} />
      
      {/* Filter Container */}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>Filters</h2>
            <p className={styles.subtitle}>Customize your search preferences</p>
          </div>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close filters"
          >
            <i className="fa fa-times" />
          </button>
        </div>

        {/* Filter Content */}
        <OverlayScrollbarsComponent
          options={{ 
            scrollbars: { autoHide: 'leave', autoHideDelay: 0 },
            overflow: { x: 'hidden', y: 'scroll' }
          }}
          className={styles.content}
        >
          {/* Age Range Filter */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Age Range</h3>
              <span className={styles.rangeDisplay}>
                {localFilters.ageRange.min} - {localFilters.ageRange.max}
              </span>
            </div>
            <div className={styles.ageRangeContainer}>
              <div className={styles.ageInputs}>
                <div className={styles.ageInputGroup}>
                  <label className={styles.inputLabel}>Min Age</label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    value={localFilters.ageRange.min}
                    onChange={(e) => handleFilterChange('ageRange', {
                      ...localFilters.ageRange,
                      min: Math.min(parseInt(e.target.value) || 18, localFilters.ageRange.max - 1)
                    })}
                    className={styles.ageInput}
                  />
                </div>
                <div className={styles.ageInputGroup}>
                  <label className={styles.inputLabel}>Max Age</label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    value={localFilters.ageRange.max}
                    onChange={(e) => handleFilterChange('ageRange', {
                      ...localFilters.ageRange,
                      max: Math.max(parseInt(e.target.value) || 65, localFilters.ageRange.min + 1)
                    })}
                    className={styles.ageInput}
                  />
                </div>
              </div>
              <div className={styles.ageSliderContainer}>
                <div className={styles.sliderTrack}>
                  <div 
                    className={styles.sliderRange}
                    style={{
                      left: `${((localFilters.ageRange.min - 18) / 47) * 100}%`,
                      width: `${((localFilters.ageRange.max - localFilters.ageRange.min) / 47) * 100}%`
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="18"
                  max="65"
                  value={localFilters.ageRange.min}
                  onChange={(e) => handleFilterChange('ageRange', {
                    ...localFilters.ageRange,
                    min: Math.min(parseInt(e.target.value), localFilters.ageRange.max - 1)
                  })}
                  className={styles.ageSlider}
                />
                <input
                  type="range"
                  min="18"
                  max="65"
                  value={localFilters.ageRange.max}
                  onChange={(e) => handleFilterChange('ageRange', {
                    ...localFilters.ageRange,
                    max: Math.max(parseInt(e.target.value), localFilters.ageRange.min + 1)
                  })}
                  className={styles.ageSlider}
                />
              </div>
            </div>
          </div>

          {/* Distance Filter */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Distance</h3>
              <span className={styles.rangeDisplay}>
                {localFilters.distance} km
              </span>
            </div>
            <div className={styles.distanceContainer}>
              <div className={styles.distanceSliderContainer}>
                <div className={styles.sliderTrack}>
                  <div 
                    className={styles.sliderProgress}
                    style={{ width: `${(localFilters.distance / 100) * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={localFilters.distance}
                  onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                  className={styles.distanceSlider}
                />
              </div>
              <div className={styles.distancePresets}>
                {[5, 10, 25, 50, 100].map(distance => (
                  <button
                    key={distance}
                    className={`${styles.presetButton} ${localFilters.distance === distance ? styles.presetButtonActive : ''}`}
                    onClick={() => handleFilterChange('distance', distance)}
                  >
                    {distance}km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interests Filter */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Interests</h3>
              <span className={styles.countDisplay}>
                {localFilters.interests.length} selected
              </span>
            </div>
            <div className={styles.chipContainer}>
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  className={`${styles.chip} ${localFilters.interests.includes(interest) ? styles.chipActive : ''}`}
                  onClick={() => handleFilterChange('interests', toggleArrayItem(localFilters.interests, interest))}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Lifestyle Filter */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Lifestyle</h3>
              <span className={styles.countDisplay}>
                {localFilters.lifestyle.length} selected
              </span>
            </div>
            <div className={styles.chipContainer}>
              {lifestyleOptions.map(lifestyle => (
                <button
                  key={lifestyle}
                  className={`${styles.chip} ${localFilters.lifestyle.includes(lifestyle) ? styles.chipActive : ''}`}
                  onClick={() => handleFilterChange('lifestyle', toggleArrayItem(localFilters.lifestyle, lifestyle))}
                >
                  {lifestyle}
                </button>
              ))}
            </div>
          </div>

          {/* Education Filter */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Education</h3>
            </div>
            <div className={styles.selectContainer}>
              <select
                value={localFilters.education}
                onChange={(e) => handleFilterChange('education', e.target.value)}
                className={styles.select}
              >
                {educationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Relationship Type Filter */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Looking For</h3>
            </div>
            <div className={styles.selectContainer}>
              <select
                value={localFilters.relationshipType}
                onChange={(e) => handleFilterChange('relationshipType', e.target.value)}
                className={styles.select}
              >
                {relationshipOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Options */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Additional Options</h3>
            </div>
            <div className={styles.checkboxContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={localFilters.hasPhotos}
                  onChange={(e) => handleFilterChange('hasPhotos', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>Has photos</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={localFilters.onlineNow}
                  onChange={(e) => handleFilterChange('onlineNow', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>Online now</span>
              </label>
            </div>
          </div>
        </OverlayScrollbarsComponent>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button 
            className={styles.resetButton}
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            className={styles.applyButton}
            onClick={handleApply}
            disabled={!hasChanges}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterContainer;
