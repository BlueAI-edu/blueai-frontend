import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { teacherApi } from '@/services/api';

const SUBMISSIONS_PAGE_PATTERN = /^\/teacher\/assessments/;
const PREV_PATH_KEY = 'prevPathForSubmissionsCheck';

export function useHasNewSubmissions() {
  const location = useLocation();
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
  const prevPath = sessionStorage.getItem(PREV_PATH_KEY);

  const isOnAssessmentsPage =
    SUBMISSIONS_PAGE_PATTERN.test(location.pathname);

  const justLeftSubmissionsPage =
    prevPath &&
    SUBMISSIONS_PAGE_PATTERN.test(prevPath) &&
    prevPath !== location.pathname;

  teacherApi.getDashboard()
    .then((res) => {
      const total = res.data?.total_submissions ?? 0;
      const stored = localStorage.getItem('lastSeenSubmissionCount');

      if (stored === null) {
        localStorage.setItem('lastSeenSubmissionCount', String(total));
        setHasNew(false);
      } else if (isOnAssessmentsPage) {
        // Entering the assessments page clears the navbar notification,
        // but does NOT update lastSeenSubmissionCount.
        setHasNew(false);
      } else if (justLeftSubmissionsPage) {
        // Leaving the assessments page marks the current count as seen
        // for the navbar/dashboard notification.
        localStorage.setItem('lastSeenSubmissionCount', String(total));
        setHasNew(false);
      } else {
        setHasNew(total > parseInt(stored, 10));
      }
    })
    .catch(() => {});

  sessionStorage.setItem(PREV_PATH_KEY, location.pathname);
  }, [location.pathname]);

  return hasNew;
}