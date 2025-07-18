import { getSubdomain } from './domainUtils';

export function createWebSocket(path = "/ws/") {
  const protocol = import.meta.env.VITE_PROTOCOL === "https" ? "wss" : "ws";
  const isDev = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");

  let host;

  if (isDev) {
    const hostname = window.location.hostname;
    host = `${hostname}:8000`;
  } else {
    // update after ngnix config
    const subdomain = getSubdomain();
    const rootDomain = import.meta.env.VITE_ROOT_DOMAIN;
    host = subdomain ? `${subdomain}.${rootDomain}` : rootDomain;
  }

  const wsUrl = `${protocol}://${host}${path}`;
  return new WebSocket(wsUrl);
}