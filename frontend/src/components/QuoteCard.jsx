export default function QuoteCard({ quote, onEdit, onDelete }) {
  return (
    <div className="flex flex-col justify-between bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
      <div className="flex-1">
        <span className="text-5xl text-brand leading-none select-none">"</span>
        <p className="text-gray-700 text-base italic leading-relaxed mt-1">
          {quote.quote}
        </p>
      </div>

      <p className="text-right text-sm font-semibold text-brand-dark mt-4">
        - {quote.author}
      </p>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={() => onEdit(quote)}
            className="flex-1 py-1.5 text-sm font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors duration-200"
          >
            Editeaza
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(quote.id)}
            className="flex-1 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
          >
            Sterge
          </button>
        )}
      </div>
    </div>
  );
}
