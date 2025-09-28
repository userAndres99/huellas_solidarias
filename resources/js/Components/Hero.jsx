export default function Hero({
  title,
  subtitle,
  children,
  showContent = true,
  heroSrc = '/images/Hero.png',
  fallback = '/images/Fallback.png',
}) {
  return (
    <section className="grid lg:grid-cols-2 gap-10 items-center">
      {showContent && (
        <div>
          {title && <h1 className="text-3xl font-bold">{title}</h1>}
          {subtitle && <p className="mt-4 text-gray-700">{subtitle}</p>}
          {children}
        </div>
      )}

      <div className="rounded-lg overflow-hidden border">
        <img
          src={heroSrc}
          alt={title ?? 'Imagen principal'}
          className="w-full h-64 object-cover"
          width={1920}
          height={1080}
          loading="eager"
          fetchpriority="high"
          decoding="async"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
        />
      </div>
    </section>
  );
}