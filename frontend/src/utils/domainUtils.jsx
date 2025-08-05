const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'teamora.website';

export const isSubdomain = () => {
  const host = window.location.hostname;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IP address

  const parts = host.split('.');
  const rootParts = ROOT_DOMAIN.split('.');

  if (parts.length === 2 && parts[1] === 'localhost') return true;

  return host.endsWith(ROOT_DOMAIN) && parts.length > rootParts.length;
};

export const getSubdomain = () => {
  const host = window.location.hostname;
  const rootParts = ROOT_DOMAIN.split('.');
  const hostParts = host.split('.');

  if (host === 'localhost' || host.endsWith('.localhost')) {
    const parts = host.split('.');
    if (parts.length === 2 && parts[1] === 'localhost') {
      return parts[0];
    }
    return null;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return null;
  }

  if (host.endsWith(ROOT_DOMAIN)) {
    const subdomainParts = hostParts.slice(0, hostParts.length - rootParts.length);
    return subdomainParts.length ? subdomainParts.join('.') : null;
  }

  return null;
};