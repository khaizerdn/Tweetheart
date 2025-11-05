import { useState, useRef, useEffect, useImperativeHandle } from 'react';
import axios from 'axios';
import validateInput from './validations';

const API_URL = import.meta.env.VITE_API_URL;
const validationCache = new Map();

export function useInputValidation({ type = 'text', label, value, onChange, min, max, confirmPassword, required = false, errorOverride = '' }, ref) {
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimeout = useRef(null);

  const performValidation = async () => {
    setIsChecking(true);

    if (errorOverride) {
      setError(errorOverride);
      setShowError(true);
      setIsChecking(false);
      validationCache.set(`${type}:${value}`, { error: errorOverride });
      return false;
    }

    if (!value && required) {
      setError(`${label} is required`);
      setShowError(true);
      setIsChecking(false);
      validationCache.set(`${type}:${value}`, { error: `${label} is required` });
      return false;
    }

    if (!value) {
      setError('');
      setShowError(false);
      setIsChecking(false);
      validationCache.set(`${type}:${value}`, { error: '' });
      return true;
    }

    const trimmedValue = ['password', 'createpassword', 'confirmPassword'].includes(type) ? value : value.trim();
    if (value !== trimmedValue) {
      onChange({ target: { value: trimmedValue } });
    }

    const cacheKey = `${type}:${trimmedValue}`;
    if (validationCache.has(cacheKey)) {
      const cachedResult = validationCache.get(cacheKey);
      setError(cachedResult.error || '');
      setShowError(!!cachedResult.error);
      setIsChecking(false);
      return !cachedResult.error;
    }

    const validationType = type === 'checkusername' ? 'username' : type === 'checkemail' ? 'email' : type;
    const validationError = validateInput(validationType, trimmedValue, { min, max, confirmPassword });
    if (validationError) {
      setError(validationError);
      setShowError(true);
      setIsChecking(false);
      validationCache.set(cacheKey, { error: validationError });
      return false;
    }

    if (type === 'checkusername' || type === 'checkemail') {
      try {
        const endpoint = type === 'checkusername' ? '/checkusername' : '/checkemail';
        const payload = type === 'checkusername' ? { username: trimmedValue } : { email: trimmedValue };
        await axios.post(`${API_URL}${endpoint}`, payload, { withCredentials: true });
        setError('');
        setShowError(false);
        validationCache.set(cacheKey, { error: '' });
        setIsChecking(false);
        return true;
      } catch (err) {
        const errorMessage = err.response?.data?.message || `Failed to check ${type === 'checkusername' ? 'username' : 'email'}`;
        setError(errorMessage);
        setShowError(true);
        validationCache.set(cacheKey, { error: errorMessage });
        setIsChecking(false);
        return false;
      }
    } else {
      setError('');
      setShowError(false);
      setIsChecking(false);
      validationCache.set(cacheKey, { error: '' });
      return true;
    }
  };

  useImperativeHandle(ref, () => ({
    validate: performValidation,
  }));

  useEffect(() => {
    if (errorOverride) {
      setError(errorOverride);
      setShowError(true);
      validationCache.set(`${type}:${value}`, { error: errorOverride });
    } else if (!errorOverride && showError && !hasInteracted) {
      setError('');
      setShowError(false);
      validationCache.set(`${type}:${value}`, { error: '' });
    }
  }, [errorOverride, type, value]);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const cacheKey = `${type}:${value}`;
    if (validationCache.has(cacheKey)) {
      const cachedResult = validationCache.get(cacheKey);
      setError(cachedResult.error || '');
      setShowError(!!cachedResult.error);
      setIsChecking(false);
      return;
    }

    if (!value && required && hasInteracted) {
      setError(`${label} is required`);
      setShowError(true);
      setIsChecking(false);
      validationCache.set(cacheKey, { error: `${label} is required` });
      return;
    }

    if (!value && !hasInteracted && !errorOverride) {
      setError('');
      setShowError(false);
      setIsChecking(false);
      validationCache.set(cacheKey, { error: '' });
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      await performValidation();
    }, 1000);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [value, type, min, max, confirmPassword, hasInteracted, required, label, errorOverride]);

  const handleChange = (e) => {
    onChange(e);
    setHasInteracted(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (required && !value && (hasInteracted || errorOverride)) {
      setError(`${label} is required`);
      setShowError(true);
      validationCache.set(`${type}:${value}`, { error: `${label} is required` });
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return { error, showError, isChecking, isFocused, handleChange, handleBlur, handleFocus };
}