import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {message && <p className="text-sm text-gray-600 mb-6">{message}</p>}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 text-sm rounded-lg font-medium text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
