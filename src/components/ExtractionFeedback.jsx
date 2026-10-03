import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { API_URL } from '@/config';

const ExtractionFeedbackContext = createContext(null);

const STORAGE_KEY = 'extraction_feedback_usage_count';
const TARGET_KEY = 'extraction_feedback_target';

const MIN_USES = 7;
const MAX_USES = 16;

const getRandomTarget = () => {
  return (
    Math.floor(
      Math.random() * (MAX_USES - MIN_USES + 1)
    ) + MIN_USES
  );
};

export function ExtractionFeedbackProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /*
   * Increment the extraction usage counter.
   *
   * This function is intentionally independent of the extraction
   * request. Calling it does not wait for or affect extraction.
   */
  const registerExtractionUse = useCallback(() => {
    const currentCount = Number(
        localStorage.getItem(STORAGE_KEY) || 0
    );

    let target = Number(
        localStorage.getItem(TARGET_KEY)
    );

    /*
    * Start a new cycle if there is no valid target.
    */
    if (
        !Number.isInteger(target) ||
        target < MIN_USES ||
        target > MAX_USES
    ) {
        target = getRandomTarget();

        localStorage.setItem(
        TARGET_KEY,
        String(target)
        );
    }

    const newCount = currentCount + 1;

    /*
    * Keep counting until the randomly selected
    * target number of extractions is reached.
    */
    if (newCount < target) {
        localStorage.setItem(
        STORAGE_KEY,
        String(newCount)
        );
        return;
    }

        /*
        * Feedback is shown at the target extraction.
        * Reset the usage counter so the next cycle
        * starts from zero.
        *
        * The next target will be randomly selected
        * when the next extraction cycle begins.
        */
        localStorage.setItem(STORAGE_KEY, '0');
        localStorage.removeItem(TARGET_KEY);

        setIsOpen(true);
    }, []);
  const closeFeedback = useCallback(() => {
    if (submitting) {
      return;
    }

    setIsOpen(false);
    setRating('');
    setComment('');
  }, [submitting]);

  const submitFeedback = useCallback(async () => {
    if (!rating && !comment.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/api/ocr/extraction-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
          body: JSON.stringify({
            rating: rating || null,
            comment: comment.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsOpen(false);
      setRating('');
      setComment('');
    } catch (error) {
      console.error(
        'Failed to submit extraction feedback:',
        error
      );
    } finally {
      setSubmitting(false);
    }
  }, [rating, comment]);

  const value = {
    registerExtractionUse,
  };

  return (
    <ExtractionFeedbackContext.Provider value={value}>
      {children}

      {isOpen &&
        createPortal(
          <ExtractionFeedbackModal
            rating={rating}
            setRating={setRating}
            comment={comment}
            setComment={setComment}
            submitting={submitting}
            onSubmit={submitFeedback}
            onClose={closeFeedback}
          />,
          document.body
        )}
    </ExtractionFeedbackContext.Provider>
  );
}

export function useExtractionFeedback() {
  const context = useContext(ExtractionFeedbackContext);

  if (!context) {
    throw new Error(
      'useExtractionFeedback must be used inside ExtractionFeedbackProvider'
    );
  }

  return context;
}

function ExtractionFeedbackModal({
  rating,
  setRating,
  comment,
  setComment,
  submitting,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="extraction-feedback-title"
      >
        <div className="mb-6">
          <h2
            id="extraction-feedback-title"
            className="text-xl font-semibold text-slate-900"
          >
            How was the extraction?
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your feedback helps us improve the extraction
            experience.
          </p>
        </div>

        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-slate-700">
            How satisfied were you?
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRating('satisfied')}
              className={`rounded-lg border px-3 py-3 text-sm transition ${
                rating === 'satisfied'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Satisfied
            </button>

            <button
              type="button"
              onClick={() => setRating('neutrally')}
              className={`rounded-lg border px-3 py-3 text-sm transition ${
                rating === 'neutrally'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Neutral
            </button>

            <button
              type="button"
              onClick={() => setRating('dissatisfied')}
              className={`rounded-lg border px-3 py-3 text-sm transition ${
                rating === 'dissatisfied'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Dissatisfied
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="extraction-feedback-comment"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Anything you'd like to tell us?
          </label>

          <textarea
            id="extraction-feedback-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Optional"
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || (!rating && !comment.trim())}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}