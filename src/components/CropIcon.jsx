/**
 * CropIcon — SVG illustrations shared between CropsManagement and Dashboard donut chart.
 * Each icon matches its rubro by normalized string matching.
 */
export default function CropIcon({ rubro, className, style }) {
  const cleanRubro = (rubro || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (cleanRubro.includes('maiz')) {
    return (
      <svg className={className} style={style} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 48C12 36 16 18 28 8C20 20 20 38 24 48Z" fill="#10B981" />
        <path d="M48 48C52 36 48 18 36 8C44 20 44 38 40 48Z" fill="#047857" />
        <rect x="25" y="16" width="14" height="28" rx="7" fill="#F59E0B" />
        <circle cx="28" cy="20" r="1.5" fill="#FEF08A" />
        <circle cx="32" cy="20" r="1.5" fill="#FEF08A" />
        <circle cx="36" cy="20" r="1.5" fill="#FEF08A" />
        <circle cx="28" cy="25" r="1.5" fill="#FBBF24" />
        <circle cx="32" cy="25" r="1.5" fill="#FEF08A" />
        <circle cx="36" cy="25" r="1.5" fill="#FBBF24" />
        <circle cx="28" cy="30" r="1.5" fill="#FEF08A" />
        <circle cx="32" cy="30" r="1.5" fill="#FEF08A" />
        <circle cx="36" cy="30" r="1.5" fill="#FEF08A" />
        <circle cx="28" cy="35" r="1.5" fill="#FBBF24" />
        <circle cx="32" cy="35" r="1.5" fill="#FEF08A" />
        <circle cx="36" cy="35" r="1.5" fill="#FBBF24" />
        <circle cx="30" cy="40" r="1.5" fill="#FEF08A" />
        <circle cx="34" cy="40" r="1.5" fill="#FEF08A" />
        <path d="M20 48C24 40 28 32 30 24C28 32 26 40 24 48Z" fill="#34D399" />
        <path d="M44 48C40 40 36 32 34 24C36 32 38 40 40 48Z" fill="#059669" />
        <rect x="29" y="44" width="6" height="8" rx="2" fill="#047857" />
      </svg>
    );
  }

  if (cleanRubro.includes('cacao')) {
    return (
      <svg className={className} style={style} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 8C30 12 32 14 30 18" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 16C20 20 16 32 22 44C26 50 30 54 32 56C34 54 38 50 42 44C48 32 44 20 34 16Z" fill="#B45309" />
        <path d="M30 16C22 20 18 30 23 40C26 45 28 48 30 50" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3" />
        <path d="M32 17C26 22 23 32 26 43C28 47 31 51 32 53" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 17C38 22 41 32 38 43C36 47 33 51 32 53" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 16C32 25 32 40 32 55" stroke="#78350F" strokeWidth="1" />
        <ellipse cx="38" cy="28" rx="2" ry="4" transform="rotate(-15 38 28)" fill="#FDBA74" opacity="0.6" />
      </svg>
    );
  }

  if (cleanRubro.includes('yuca')) {
    return (
      <svg className={className} style={style} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26 12C28 15 34 15 36 12" stroke="#451A03" strokeWidth="2" />
        <path d="M28 14C24 22 20 34 26 44C30 50 34 54 36 56C36 50 38 40 38 34C38 24 34 18 30 14Z" fill="#78350F" />
        <path d="M27 20C25 24 25 28 28 32" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />
        <path d="M33 26C35 30 35 34 32 38" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M30 40C28 44 29 48 33 51" stroke="#D97706" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M29 34C31 35 32 37 32 39C30 39 29 37 29 34Z" fill="#FEF3C7" opacity="0.8" />
      </svg>
    );
  }

  if (cleanRubro.includes('platano') || cleanRubro.includes('banana')) {
    return (
      <svg className={className} style={style} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 16C24 16 44 20 48 38C50 46 44 50 40 52C42 46 44 38 38 28C32 18 20 18 16 16Z" fill="#FBBF24" />
        <path d="M16 16C15 13 14 12 16 10C17 10 18 12 18 15Z" fill="#059669" />
        <path d="M40 52C40 50 41 49 43 49C42 51 41 52 40 52Z" fill="#1E293B" />
        <path d="M20 18C28 20 41 24 43 36C44 42 40 46 38 48" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 20C18 20 36 24 40 38C38 34 32 28 26 24C20 20 14 20 12 20Z" fill="#F59E0B" opacity="0.8" />
      </svg>
    );
  }

  // Fallback genérico
  return (
    <svg className={className} style={style} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" fill="#d1fae5" />
      <path d="M32 12C32 12 20 24 20 36C20 44 26 52 32 52C38 52 44 44 44 36C44 24 32 12 32 12Z" fill="#10B981" />
      <path d="M32 20C32 20 26 28 26 36C26 42 28 46 32 46" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
