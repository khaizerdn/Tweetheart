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
  const [tempValues, setTempValues] = useState({
    minAge: filters.minAge,
    maxAge: filters.maxAge,
    distance: filters.distance
  });

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
    setTempValues({
      minAge: filters.minAge,
      maxAge: filters.maxAge,
      distance: filters.distance
    });
    setHasChanges(false);
  }, [filters, isOpen]);

  // Preset chips
  const ageRangeOptions = [
    { label: '18-25', min: 18, max: 25 },
    { label: '26-35', min: 26, max: 35 },
    { label: '36-45', min: 36, max: 45 },
    { label: '46-55', min: 46, max: 55 },
    { label: '56-65', min: 56, max: 65 },
  ];

  const distanceOptions = [5, 10, 25, 50, 100];

  const handleFilterChange = (filterType, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setHasChanges(true);
  };

  const handleTempValueChange = (field, value) => {
    setTempValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValueBlur = (field, value) => {
    let constrainedValue = value;
    
    if (field === 'minAge') {
      constrainedValue = Math.min(Math.max(parseInt(value) || 18, 18), localFilters.maxAge - 1);
    } else if (field === 'maxAge') {
      constrainedValue = Math.max(Math.min(parseInt(value) || 65, 65), localFilters.minAge + 1);
    } else if (field === 'distance') {
      constrainedValue = Math.min(Math.max(parseInt(value) || 50, 1), 100);
    }
    
    setTempValues(prev => ({
      ...prev,
      [field]: constrainedValue
    }));
    
    handleFilterChange(field, constrainedValue);
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
    setTempValues({
      minAge: 18,
      maxAge: 65,
      distance: 50
    });
    onResetFilters();
    setHasChanges(true);
  };

  const handleClose = () => {
    if (hasChanges) {
      // Revert to original filters
      setLocalFilters(filters);
      setTempValues({
        minAge: filters.minAge,
        maxAge: filters.maxAge,
        distance: filters.distance
      });
      setHasChanges(false);
    }
    onClose();
  };

  // Removed interests, lifestyle, education, and additional options

  // Removed relationship type options

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
          {/* Age Range Filter (Chips) */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Age Range</h3>
            <div className={styles.chipContainer}>
              {ageRangeOptions.map((range) => {
                const isSelected = localFilters.minAge === range.min && localFilters.maxAge === range.max;
                return (
                  <button
                    key={range.label}
                    className={`${styles.chip} ${isSelected ? styles.chipActive : ''}`}
                    onClick={() => {
                      handleFilterChange('minAge', range.min);
                      handleFilterChange('maxAge', range.max);
                    }}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distance Filter (Chips) */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Distance</h3>
            <div className={styles.chipContainer}>
              {distanceOptions.map((km) => (
                <button
                  key={km}
                  className={`${styles.chip} ${localFilters.distance === km ? styles.chipActive : ''}`}
                  onClick={() => handleFilterChange('distance', km)}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Removed Interests, Lifestyle, Education, Additional Options, and Looking For */}
          
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
