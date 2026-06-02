type TerraveMarkProps = {
  className?: string;
  strokeWidth?: number;
};

export function TerraveMark({ className, strokeWidth = 2.6 }: TerraveMarkProps) {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 7C22.5 15 16 24.5 13 34.5C10.2 43.8 10.9 53 15.6 61.1C19.7 68.2 25.6 73.4 32 76C38.4 73.4 44.3 68.2 48.4 61.1C53.1 53 53.8 43.8 51 34.5C48 24.5 41.5 15 32 7Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 8V76"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M32 21C28.2 16.8 24.3 13.5 20.4 10.9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M32 34C26.6 28 21.2 23.5 16.3 20.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M32 48C26.2 42 20.8 37.5 16.2 34.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M32 21C35.8 16.8 39.7 13.5 43.6 10.9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M32 34C37.4 28 42.8 23.5 47.7 20.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M32 48C37.8 42 43.2 37.5 47.8 34.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
