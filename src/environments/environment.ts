export const environment = {
    production: false,
    ssoCoreUrl: 'http://localhost:3000',       // SSO Core
    ssoPortalUrl: 'http://localhost:4201',        // SSO Portal
    appId: 'ordamy',
    baseUrl: 'http://localhost:4200/',
    callbackUrl: 'auth/callback',
    middlewareBaseUrl: 'http://localhost:4300',    // ordamy-middleware
    mockAuth: true,                         // true = bypass SSO & Permissions locally
};
