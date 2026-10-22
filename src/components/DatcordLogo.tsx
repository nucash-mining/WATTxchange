import React from 'react';

/** The Datcord brand mark, usable anywhere a lucide icon component is expected. */
const DatcordLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src={`${import.meta.env.BASE_URL}datcord-logo.png`}
    alt=""
    aria-hidden="true"
    className={`${className} object-contain`}
  />
);

export default DatcordLogo;
