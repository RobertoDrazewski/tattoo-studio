import lockup from '../assets/logo-lockup.png';
import mark from '../assets/logo-mark.png';

// Logo de Rick Art en NEGRO (para fondo blanco). variant: 'lockup' | 'mark'
export default function Logo({ height = 48, variant = 'lockup', className = '' }) {
  return (
    <img src={variant === 'mark' ? mark : lockup} alt="Rick Art"
         style={{ height }} className={`w-auto select-none ${className}`} draggable="false" />
  );
}
