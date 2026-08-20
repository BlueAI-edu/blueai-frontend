import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/config';

/**
 * useStats
 * Fetches dashboard stats. Gracefully degraded if unavailable.
 * Returns standardized { data, loading, error, retry } format.
 */
export const useStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API}/teacher/dashboard`);
      setData(res.data);
    } catch (err) {
      // Stats are supplementary; log but don't aggressively error
      console.warn('[Dashboard] Stats fetch failed:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    retry();
  }, [retry]);

  return { data, loading, error, retry };
};

/**
 * useAssessments
 * Fetches all assessments for the teacher, sorted by recency.
 * Returns standardized { data, loading, error, retry } format.
 */
export const useAssessments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API}/teacher/assessments`);
      const all = Array.isArray(res.data)
        ? res.data
        : (res.data?.assessments || []);
      const sorted = [...all].sort((a, b) =>
        new Date(b.updated_at || b.created_at || 0) -
        new Date(a.updated_at || a.created_at || 0)
      );
      setData(sorted);
    } catch (err) {
      console.error('[Dashboard] Assessments fetch failed:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    retry();
  }, [retry]);

  return { data, loading, error, retry };
};

/**
 * useReviewQueue
 * Fetches submissions flagged for teacher review.
 * Returns standardized { data, loading, error, retry } format.
 */
export const useReviewQueue = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API}/teacher/submissions/needs-review`);
      setData(res.data?.submissions || []);
    } catch (err) {
      console.error('[Dashboard] Review queue fetch failed:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    retry();
  }, [retry]);

  return { data, loading, error, retry };
};

/**
 * Composite hook: combine all dashboard data fetches
 * Used for detecting root-level page failures (all critical data sources failed)
 */
export const useDashboardData = () => {
  const stats = useStats();
  const assessments = useAssessments();
  const reviewQueue = useReviewQueue();

  // Root failure: both critical data sources failed (stats is supplementary)
  const isRootFailure = assessments.error && reviewQueue.error;

  // Loading: waiting for any critical data
  const isLoading = assessments.loading || reviewQueue.loading;

  return {
    stats,
    assessments,
    reviewQueue,
    isRootFailure,
    isLoading,
  };
};
