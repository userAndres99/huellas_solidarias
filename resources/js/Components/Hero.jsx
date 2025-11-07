export default function Hero({
  title,
  subtitle,
  children,
  showContent = true,
  heroSrc = '/images/Hero.jpg',
  fallback = '/images/Fallback.png',
  imageClass = 'w-full h-64 object-cover',
}) {
  return (
    <section className="grid lg:grid-cols-2 gap-10 items-center">
        {showContent && (
        <div className="fade-in">
          {title && <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">{title}</h1>}
          {subtitle && <p className="mt-4 text-lg text-slate-700">{subtitle}</p>}
          <div className="mt-6 space-y-3">
            {children}
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden card-surface border border-transparent fade-in fade-delay-2">
        <img
          src={heroSrc}
          alt={title ?? 'Imagen principal'}
          className={`${imageClass} object-cover w-full h-full`}
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
        />
      </div>
    </section>
  );
}