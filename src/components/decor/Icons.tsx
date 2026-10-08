/** Små håndtegnede ikoner i tusjstil til informasjonssiden. */
const common = {
  viewBox: '0 0 48 48',
  width: 40,
  height: 40,
  fill: 'none',
  stroke: '#4a3426',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export const CalendarIcon = () => (
  <svg {...common}>
    <rect x="8" y="11" width="32" height="29" rx="4" fill="#fcf2d9" />
    <path d="M8 19.5 H40" />
    <path d="M8 11.5 C 8 11 9 11 12 11 H36 C 39 11 40 11.5 40 12 V19 H8 Z" fill="#e8a93a" />
    <path d="M16 7 V14 M32 7 V14" />
    <path d="M24 33 C 19 29 17 27 17 25 C 17 23 18.7 22 20.3 22 C 22 22 23.2 23 24 24.4 C 24.8 23 26 22 27.7 22 C 29.3 22 31 23 31 25 C 31 27 29 29 24 33 Z" fill="#e8a79a" />
  </svg>
);

export const ClockIcon = () => (
  <svg {...common}>
    <circle cx="24" cy="25" r="15" fill="#fcf2d9" />
    <path d="M24 16 V25 L30 29" />
    <path d="M14 9 L9 13 M34 9 L39 13" />
    <circle cx="24" cy="25" r="1.4" fill="#4a3426" />
  </svg>
);

export const ChurchIcon = () => (
  <svg {...common}>
    <path d="M24 3 V10 M21 6 H27" />
    <path d="M17 20 L24 10 L31 20" fill="#c97b5a" />
    <rect x="17" y="20" width="14" height="21" fill="#fcf2d9" />
    <path d="M9 41 V29 L17 24 M39 41 V29 L31 24" fill="#f3dfb6" />
    <path d="M6 41 H42" />
    <path d="M21.5 41 V35 C 21.5 33 26.5 33 26.5 35 V41" fill="#8b6a4a" />
    <circle cx="24" cy="26" r="2.4" fill="#e8a93a" />
  </svg>
);

export const CakeIcon = () => (
  <svg {...common}>
    <path d="M9 40 H39 V28 C 39 26 37 25 35 25 H13 C 11 25 9 26 9 28 Z" fill="#fcf2d9" />
    <path d="M9 31 C 13 34 15 28 19 31 C 23 34 25 28 29 31 C 33 34 35 28 39 31" stroke="#e8a79a" strokeWidth="3" />
    <path d="M9 31 C 13 34 15 28 19 31 C 23 34 25 28 29 31 C 33 34 35 28 39 31" />
    <path d="M17 25 V18 M24 25 V16 M31 25 V18" />
    <path d="M17 13.5 C 18.6 15 18.6 16.5 17 17 C 15.4 16.5 15.4 15 17 13.5 Z M24 11.5 C 25.6 13 25.6 14.5 24 15 C 22.4 14.5 22.4 13 24 11.5 Z M31 13.5 C 32.6 15 32.6 16.5 31 17 C 29.4 16.5 29.4 15 31 13.5 Z" fill="#e8a93a" />
    <path d="M6 40 H42" />
  </svg>
);

export const HoneyIcon = () => (
  <svg {...common}>
    <path d="M14 17 C 9 21 7 26 7 30 C 7 37 14 42 24 42 C 34 42 41 37 41 30 C 41 26 39 21 34 17 Z" fill="#c77d3e" />
    <path d="M14 18 C 14 22 16 25 18 25 C 20 25 20 21 21 19 C 22 22 22 28 25 28 C 28 28 27 22 28 19 C 29 21 30 23 32 23 C 34 23 34 19 34 18 Z" fill="#eeb03a" />
    <rect x="11" y="11" width="26" height="7" rx="3.5" fill="#b06a32" />
    <path d="M30 10 L37 3" strokeWidth="3" />
  </svg>
);

export const InfoIcon = () => (
  <svg {...common}>
    <path d="M24 6 C 34 6 42 13 42 23 C 42 33 34 40 24 40 C 21 40 18 39.5 16 38.5 L8 42 L10 35 C 7.5 32 6 28 6 23 C 6 13 14 6 24 6 Z" fill="#fcf2d9" />
    <path d="M24 21 V31" strokeWidth="2.6" />
    <circle cx="24" cy="15.5" r="1.8" fill="#4a3426" stroke="none" />
  </svg>
);

export const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 21 C 12 21 5 14.5 5 9.5 C 5 5.6 8.1 3 12 3 C 15.9 3 19 5.6 19 9.5 C 19 14.5 12 21 12 21 Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const CalendarAddIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10 H20.5 M8 3 V7 M16 3 V7 M12 13 V18 M9.5 15.5 H14.5" />
  </svg>
);
