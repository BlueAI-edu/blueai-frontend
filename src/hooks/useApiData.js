import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { getApiErrorMessage } from '@/lib/handle-error';
import { normaliseList } from '@/utils/apiNormalizers';

/**
 * Generic data-fetching hook.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApiData('/teacher/assessments');
 *   const { data, loading, error, refetch } = useApiData('/teacher/classes', {}, 'classes');
 *   const { data, loading, error, refetch } = useApiData(null); // skip until url is set
 *
 * @param {string|null} url      Full URL (including /api prefix) or null to skip initial fetch.
 * @param {object}      opts     axios config options (e.g. { params: { page: 1 } })
 * @param {string|null} listKey  If set, extracts response.data[listKey] (or response.data if it's
 *                               already an array), normalising both response shapes into a plain array.
 */
export function useApiData(url, opts = {}, listKey = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const fetchData = useCallback(async (fetchUrl) => {
    if (!fetchUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(fetchUrl, optsRef.current);
      setData(listKey ? normaliseList(res.data, listKey) : res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [listKey]);

  useEffect(() => {
    fetchData(url);
  }, [url, fetchData]);

  const refetch = useCallback(() => fetchData(url), [url, fetchData]);

  return { data, loading, error, refetch, setData };
}
