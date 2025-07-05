const ROOT_DOMAIN = process.env.REACT_APP_ROOT_DOMAIN || 'chronocrust.shop';

export const isSubdomain = () => {
  const host = window.location.hostname;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IP address
  if (host === 'localhost' || host.endsWith('.localhost')) return false;

  const parts = host.split('.');
  const rootParts = ROOT_DOMAIN.split('.');

  if (parts.length === 2 && parts[1] === 'localhost') return true;

  return host.endsWith(ROOT_DOMAIN) && parts.length > rootParts.length;
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
  const rootParts = ROOT_DOMAIN.split('.');

  if (host.endsWith(ROOT_DOMAIN) && parts.length > rootParts.length) {
    return parts.slice(0, parts.length - rootParts.length).join('.');
  }

  return null;
};