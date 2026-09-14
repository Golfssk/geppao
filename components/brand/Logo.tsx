export function Logo({ size = 34 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-label="GepPao logo" role="img">
    <path d="M8 14Q8 10 12 10H22Q26 10 26 14V26Q26 30 22 30H12Q8 30 8 26V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 10Q17 4 22 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="17" cy="20" r="1.6" fill="#ACC8A2"/>
  </svg>
}
