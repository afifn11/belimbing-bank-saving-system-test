import Modal from './Modal';
import { Trash2 } from 'lucide-react';

export default function ConfirmDelete({ title, message, onConfirm, onClose, loading }) {
  return (
    <Modal title="Confirm Delete" onClose={onClose} footer={
      <>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          <Trash2 size={14} /> {loading ? 'Deleting…' : 'Delete'}
        </button>
      </>
    }>
      <div className="alert alert-danger">
        <strong>{title}</strong>
        <p style={{ marginTop: 6 }}>{message}</p>
      </div>
    </Modal>
  );
}
