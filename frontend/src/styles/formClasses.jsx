// src/styles/formClasses.js
import clsx from 'clsx';

export const getInputClasses = (hasError = false) =>
  clsx(
    'w-full px-3 py-2 rounded-md border bg-[#E5E8EC] focus:outline-none focus:ring-1',
    'text-[#1A2A44] placeholder:text-[#B0B8C5]',
    {
      'border-[#B0B8C5] focus:ring-[#00C4B4]': !hasError,
      'border-[#EF4444] focus:ring-[#EF4444]': hasError,
    }
  );