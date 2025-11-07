export default function FeatureCard({ title, children, className = '' }) {
  return (
    <div className={`card-surface rounded-xl p-6 border border-transparent fade-in card-hover ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-md flex items-center justify-center text-white shadow-sm icon-float" style={{ backgroundImage: 'linear-gradient(45deg, var(--color-primary), var(--color-brand))' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a2 2 0 00-2 2v6H6a2 2 0 100 4h8a2 2 0 100-4h-2V4a2 2 0 00-2-2z" />
            </svg>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
          <p className="mt-2 text-sm text-slate-700">{children}</p>
        </div>
      </div>
    </div>
  );
}