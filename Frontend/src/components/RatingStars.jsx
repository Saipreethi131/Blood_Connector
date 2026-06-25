export function RatingStars({ rating }) {
  if (!rating) return null;
  const full = Math.round(rating.avg);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)} {rating.avg} ({rating.count})
    </span>
  );
}

export function RatingInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className="text-2xl leading-none transition-transform hover:scale-110"
          style={{ color: n <= value ? '#FFD700' : '#ddd' }}>
          ★
        </button>
      ))}
    </div>
  );
}
