import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface HeaderStatsPortalProps {
  children: React.ReactNode;
}

export const HeaderStatsPortal: React.FC<HeaderStatsPortalProps> = ({ children }) => {
  const [container, setContainer] = useState<HTMLElement | null>(() => {
    return typeof document !== 'undefined' ? document.getElementById('header-stats-portal') : null;
  });

  useEffect(() => {
    if (!container && typeof document !== 'undefined') {
      setContainer(document.getElementById('header-stats-portal'));
    }
  }, [container]);

  if (!container) return null;
  return createPortal(children, container);
};
