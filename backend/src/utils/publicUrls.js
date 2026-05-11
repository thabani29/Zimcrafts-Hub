const DEFAULT_BACKEND_BASE_URL = 'https://zimcrafts-hub.onrender.com';

const normalizeBaseUrl = (value, fallback = DEFAULT_BACKEND_BASE_URL) =>
    String(value || fallback)
        .trim()
        .replace(/\/$/, '');

const normalizePath = (path = '') => {
    if (!path) {
        return '';
    }

    return path.startsWith('/') ? path : `/${path}`;
};

const getBackendBaseUrl = () =>
    normalizeBaseUrl(process.env.BACKEND_URL || process.env.BASE_URL);

const getPublicAppBaseUrl = () =>
    normalizeBaseUrl(
        process.env.FRONTEND_URL ||
            process.env.PUBLIC_APP_URL ||
            process.env.BASE_URL ||
            process.env.BACKEND_URL
    );

const buildBackendUrl = (path = '') =>
    `${getBackendBaseUrl()}${normalizePath(path)}`;

const buildPublicAppUrl = (path = '') =>
    `${getPublicAppBaseUrl()}${normalizePath(path)}`;

module.exports = {
    DEFAULT_BACKEND_BASE_URL,
    getBackendBaseUrl,
    getPublicAppBaseUrl,
    buildBackendUrl,
    buildPublicAppUrl,
};
