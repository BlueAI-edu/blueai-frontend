import { useState, useCallback } from 'react';

/**
 * Lightweight form state hook.
 *
 * Usage:
 *   const { values, setField, reset, handleSubmit, submitting, error } =
 *     useForm({ name: '', email: '' }, async (values) => { await api.post(..., values); });
 */
export function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setError('');
  }, [initialValues]);

  const handleSubmit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(values);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Something went wrong';
      setError(Array.isArray(msg) ? msg.map((m) => m.msg || m).join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  }, [values, onSubmit]);

  return { values, setValues, setField, handleChange, reset, handleSubmit, submitting, error, setError };
}
