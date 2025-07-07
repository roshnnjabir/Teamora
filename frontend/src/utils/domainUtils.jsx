// utils/domainUtils.js

export const isSubdomain = () => {
  const host = window.location.hostname;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPs
  if (host === 'localhost' || host.endsWith('.localhost')) return false;

  const parts = host.split('.');
  if (parts.length === 2 && parts[1] === 'localhost') return true;

  return host.endsWith('chronocrust.shop') && parts.length > 2;
};

export const getSubdomain = () => {
  const host = window.location.hostname;

  if (
    host === 'localhost' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.endsWith('.localhost')
  ) {
    return null;
  }

  const parts = host.split('.');
  if (host.endsWith('chronocrust.shop') && parts.length > 2) {
    return parts[0];
  }

  return null;
};