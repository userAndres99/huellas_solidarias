import React from 'react';
import { FaPaw, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

function normalize(s) {
  if (!s) return 'activo';
  try {
    return s
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, '')
      .replace(/ó/g, 'o')
      .replace(/á/g, 'a');
  } catch (e) {
    return s.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  }
}

export default function EstadoBadge({ situacion }) {
  const key = normalize(situacion);

  const iconProps = { size: 14, className: 'inline-block -mt-0.5' };

  const Icon = (() => {
    switch (key) {
      case 'adopcion':
        return <FaPaw {...iconProps} />;
      case 'abandonado':
        return <FaTimesCircle {...iconProps} />;
      case 'perdido':
        return <FaExclamationTriangle {...iconProps} />;
      default:
        return <FaExclamationTriangle {...iconProps} />;
    }
  })();

  return (
    <span className={`px-3 py-1 rounded-full badge-estado ${key}`} aria-label={`Estado: ${situacion || 'Publicación'}`}>
      {Icon}
      <span className="ms-1">{situacion || 'Publicación'}</span>
    </span>
  );
}
