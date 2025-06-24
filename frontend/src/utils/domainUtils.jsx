// utils/domainUtils.js
export const isSubdomain = () => {
  const host = window.location.hostname;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPs are not subdomains
  if (host === 'localhost') return false; // plain localhost is main
  const parts = host.split('.');

  if (parts.length === 2 && parts[1] === 'localhost') return true; // e.g., sub.localhost
  return parts.length > 2; // e.g., sub.example.com
};