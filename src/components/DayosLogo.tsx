import React from 'react';

interface DayosLogoProps {
  className?: string;
  theme?: 'black' | 'white';
}

export const DayosLogo: React.FC<DayosLogoProps> = ({ className = 'h-7 w-auto', theme = 'black' }) => {
  const color = theme === 'white' ? '#ffffff' : '#000000';

  return (
    <svg
      viewBox="0 0 365 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      xmlSpace="preserve"
    >
      <g>
        <path
          className="wheel"
          d="M87.3038 43.3637L78.2715 15.4011L67.3518 16.3868C64.2511 16.6672 61.429 14.5781 60.764 11.5214L58.2655 0H29.0384L26.5399 11.5214C25.8748 14.5781 23.0527 16.6672 19.9521 16.3868L9.02337 15.4011L0 43.3637L9.45477 49.0611C12.124 50.6708 13.1846 54.026 11.9353 56.8928L7.2169 67.7269L30.8628 85L39.5357 77.2226C41.8814 75.1245 45.4135 75.1245 47.7592 77.2226L56.432 85L80.0779 67.7269L75.3596 56.8928C74.1103 54.026 75.1708 50.6708 77.8401 49.0611L87.2948 43.3637H87.3038ZM40.021 70.6751L17.8221 54.46C15.6561 52.8774 14.7484 50.0739 15.5752 47.5056L24.0414 21.2884C24.8682 18.7291 27.2409 16.9928 29.9191 16.9928H57.3757C60.054 16.9928 62.4266 18.7291 63.2535 21.2884L71.7196 47.5056C72.5465 50.0649 71.6388 52.8774 69.4728 54.46L47.2738 70.6751C45.1079 72.2577 42.178 72.2577 40.021 70.6751Z"
          fill={color}
        />
      </g>
      <text
        x="106"
        y="66.5"
        fill={color}
        fontFamily="SuisseIntl, -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="700"
        fontSize="62px"
        letterSpacing="-0.03em"
      >
        WebOps
      </text>
    </svg>
  );
};
