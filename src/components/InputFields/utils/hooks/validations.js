const validatePassword = (value) => {
  if (value.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(value)) return 'Uppercase letter required';
  if (!/[a-z]/.test(value)) return 'Lowercase letter required';
  if (!/[0-9]/.test(value)) return 'Number required';
  if (!/[^A-Za-z0-9\s]/.test(value)) return 'Special character required';
  return '';
};

const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Invalid email address';
  return '';
};

const validateUsername = (value) => {
  if (!value) return 'Username required';
  const trimmedValue = value.trim();
  if (trimmedValue.length < 5) return 'Minimum 5 characters';
  if (trimmedValue.length > 30) return 'Maximum 30 characters';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$/.test(trimmedValue)) {
    return 'Only use letters, numbers, . _ -';
  }
  return '';
};

const validateName = (value) => {
  if (!value) return 'Name required';
  const trimmedValue = value.trim();
  if (trimmedValue.length < 2) return 'Minimum 2 characters';
  if (trimmedValue.length > 50) return 'Maximum 50 characters';
  if (!/^[A-Za-z\s]+$/.test(trimmedValue)) return 'Only letters and spaces';
  const words = trimmedValue.split(/\s+/).filter(word => word.length > 0);
  if (words.length === 0) return 'Name required';
  for (const word of words) {
    if (!/^[A-Z][a-z]*$/.test(word)) {
      return 'Capitalize first letter of each word';
    }
  }
  return '';
};

const formatDateToMMDDYYYY = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
};

const resolveDateConstraint = (constraint) => {
  if (!constraint || constraint === '') return null;
  if (constraint === 'present') return new Date();
  
  const dateMatch = constraint.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    return new Date(`${year}-${month}-${day}`);
  }
  
  const relativeMatch = constraint.match(/^(\d+)([y|m|d])$/);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];
    const date = new Date();
    if (unit === 'y') date.setFullYear(date.getFullYear() - value);
    if (unit === 'm') date.setMonth(date.getMonth() - value);
    if (unit === 'd') date.setDate(date.getDate() - value);
    return date;
  }
  
  return null;
};

const validateDate = (value, { min, max } = {}) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return 'Invalid date format';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Invalid date';

  const resolvedMin = resolveDateConstraint(min);
  const resolvedMax = resolveDateConstraint(max);

  if (resolvedMin) {
    if (isNaN(resolvedMin.getTime())) return 'Invalid min date';
    if (date < resolvedMin) return `Date must be after ${formatDateToMMDDYYYY(resolvedMin)}`;
  }

  if (resolvedMax) {
    if (isNaN(resolvedMax.getTime())) return 'Invalid max date';
    if (date > resolvedMax) return `Date must be before ${max === 'present' ? 'present' : formatDateToMMDDYYYY(resolvedMax)}`;
  }

  return '';
};

const validateInput = (type, value, options = {}) => {
  switch (type) {
    case 'createpassword':
      return validatePassword(value);
    case 'password':
      return '';
    case 'email':
      return validateEmail(value);
    case 'username':
      return validateUsername(value);
    case 'firstname':
    case 'lastname':
      return validateName(value);
    case 'date':
      return validateDate(value, options);
    case 'text':
      return '';
    case 'confirmPassword':
      if (value !== options.confirmPassword) return 'Passwords do not match';
      return '';
    default:
      return '';
  }
};

export default validateInput;