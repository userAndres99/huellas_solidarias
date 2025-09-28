export default function TarjetaCaracteristica({ titulo, children, className = '' }) {
  return (
    <div className={className}>
      <h4 className="font-semibold">{titulo}</h4>
      <p className="mt-2 text-sm text-gray-600">{children}</p>
    </div>
  );
}