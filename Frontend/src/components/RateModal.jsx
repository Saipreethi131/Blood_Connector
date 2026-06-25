import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { RatingInput } from './RatingStars.jsx';

export default function RateModal({ requestId, targetLabel, onClose, onSubmitted }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) { toast.error('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      await api.post('/ratings', { requestId, stars, comment });
      toast.success('Thanks for your feedback!');
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,46,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" style={{ animation: 'slideUp 0.2s ease-out' }}>
        <h3 className="font-bold text-[#1A1A2E] mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Rate {targetLabel}
        </h3>
        <p className="text-sm text-slate-500 mb-4">How was your experience?</p>
        <div className="flex justify-center mb-4">
          <RatingInput value={stars} onChange={setStars} />
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3}
          placeholder="Optional comment…" className="input-field text-sm resize-none mb-4" />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Skip</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm py-2 px-5 disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
