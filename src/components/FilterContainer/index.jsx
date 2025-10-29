import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import InputField from '../InputFields';
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

  // Additional options for chips
  const additionalOptions = [
    'Online now', 'Has photos', 'Verified profile', 'New profiles', 
    'Recently active', 'Premium members', 'Nearby only'
  ];

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
      minAge: 18,
      maxAge: 65,
      distance: 50,
      interests: [],
      lifestyle: [],
      education: 'any',
      relationshipType: 'any',
      additionalOptions: []
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
            <h3 className={styles.sectionTitle}>Age Range</h3>
            <div className={styles.ageInputs}>
              <InputField
                type="text"
                label="Minimum"
                value={localFilters.minAge}
                onChange={(e) => handleFilterChange('minAge', Math.min(parseInt(e.target.value) || 18, localFilters.maxAge - 1))}
                styles={{
                  background: 'var(--background-color-2)',
                  backgroundOption: 'var(--background-color-3)',
                  disabled: 'var(--background-color-primary-disabled-2)',
                  muted: 'var(--background-color-primary-muted-2)',
                  default: 'var(--background-color-primary-default-2)',
                  hover: 'var(--background-color-primary-hover-2)',
                  active: 'var(--background-color-primary-active-2)',
                  selected: 'var(--background-color-primary-selected-2)',
                }}
              />
              <InputField
                type="text"
                label="Maximum"
                value={localFilters.maxAge}
                onChange={(e) => handleFilterChange('maxAge', Math.max(parseInt(e.target.value) || 65, localFilters.minAge + 1))}
                styles={{
                  background: 'var(--background-color-2)',
                  backgroundOption: 'var(--background-color-3)',
                  disabled: 'var(--background-color-primary-disabled-2)',
                  muted: 'var(--background-color-primary-muted-2)',
                  default: 'var(--background-color-primary-default-2)',
                  hover: 'var(--background-color-primary-hover-2)',
                  active: 'var(--background-color-primary-active-2)',
                  selected: 'var(--background-color-primary-selected-2)',
                }}
              />
            </div>
          </div>

          {/* Distance Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Distance</h3>
            <InputField
              type="text"
              label="Kilometers"
              value={localFilters.distance}
              onChange={(e) => handleFilterChange('distance', parseInt(e.target.value) || 50)}
              styles={{
                background: 'var(--background-color-2)',
                backgroundOption: 'var(--background-color-3)',
                disabled: 'var(--background-color-primary-disabled-2)',
                muted: 'var(--background-color-primary-muted-2)',
                default: 'var(--background-color-primary-default-2)',
                hover: 'var(--background-color-primary-hover-2)',
                active: 'var(--background-color-primary-active-2)',
                selected: 'var(--background-color-primary-selected-2)',
              }}
            />
          </div>

          {/* Interests Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Interests</h3>
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
            <h3 className={styles.sectionTitle}>Lifestyle</h3>
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
            <h3 className={styles.sectionTitle}>Education</h3>
            <InputField
              type="select"
              label="Education Level"
              value={localFilters.education}
              onChange={(e) => handleFilterChange('education', e.target.value)}
              options={educationOptions}
              styles={{
                background: 'var(--background-color-2)',
                backgroundOption: 'var(--background-color-3)',
                disabled: 'var(--background-color-primary-disabled-2)',
                muted: 'var(--background-color-primary-muted-2)',
                default: 'var(--background-color-primary-default-2)',
                hover: 'var(--background-color-primary-hover-2)',
                active: 'var(--background-color-primary-active-2)',
                selected: 'var(--background-color-primary-selected-2)',
              }}
            />
          </div>

          {/* Relationship Type Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Looking For</h3>
            <InputField
              type="select"
              label="Relationship Type"
              value={localFilters.relationshipType}
              onChange={(e) => handleFilterChange('relationshipType', e.target.value)}
              options={relationshipOptions}
              styles={{
                background: 'var(--background-color-2)',
                backgroundOption: 'var(--background-color-3)',
                disabled: 'var(--background-color-primary-disabled-2)',
                muted: 'var(--background-color-primary-muted-2)',
                default: 'var(--background-color-primary-default-2)',
                hover: 'var(--background-color-primary-hover-2)',
                active: 'var(--background-color-primary-active-2)',
                selected: 'var(--background-color-primary-selected-2)',
              }}
            />
          </div>

          {/* Additional Options */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Additional Options</h3>
            <div className={styles.chipContainer}>
              {additionalOptions.map(option => (
                <button
                  key={option}
                  className={`${styles.chip} ${localFilters.additionalOptions?.includes(option) ? styles.chipActive : ''}`}
                  onClick={() => handleFilterChange('additionalOptions', toggleArrayItem(localFilters.additionalOptions || [], option))}
                >
                  {option}
                </button>
              ))}
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
