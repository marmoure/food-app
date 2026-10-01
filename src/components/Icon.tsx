import type { CSSProperties } from 'react';

const paths = {
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1.1-2.6H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z" />
      <path d="M7.5 10h.01M10 6.5h.01M14.5 7h.01M17.5 10.5h.01" strokeWidth="3" />
    </>
  ),
  cube: (
    <>
      <path d="m12 3 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8" />
      <path d="m7.5 5.5 9 5" />
    </>
  ),
  home: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  freezer: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <path d="M5 10h14M8 6v1M8 14v3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 11h18M7 15h2M12 15h2M7 18h2" />
    </>
  ),
  book: (
    <>
      <path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v15" />
      <path d="M6 8h3M15 8h3M6 12h3M15 12h3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  left: <path d="m14 6-6 6 6 6" />,
  right: <path d="m10 6 6 6-6 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1" />
    </>
  ),
  moon: <path d="M21 12.7A9 9 0 0 1 11.3 3 9 9 0 1 0 21 12.7Z" />,
  sparkles: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
      <path d="M21 2v4M19 4h4" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 3C11 2 3 7 5 14s15 5 15-11Z" />
      <path d="m4 21 11-12" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="10" cy="18" r="2" />
    </>
  ),
};
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
