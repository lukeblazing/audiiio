export const parseCookies = (cookieString) => {
    return cookieString
        ? Object.fromEntries(cookieString.split('; ').map(cookie => cookie.split('=')))
        : {};
};
