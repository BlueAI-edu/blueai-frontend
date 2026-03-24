import { useState, useCallback } from 'react';

export function useAsync() {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async (fn, onError) => {
    setIsLoading(true);
    try {
      return await fn();
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [run, isLoading];
}
