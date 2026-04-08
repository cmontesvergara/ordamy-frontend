export const environment = {
    production: false,
    ssoCoreUrl: 'http://localhost:3000',       // SSO Core
    ssoPortalUrl: 'http://localhost:3001',        // SSO Portal
    appId: 'ad7b4e78-a856-486e-9f4c-9fe0a73eb780',
    baseUrl: 'http://localhost:4001',
    callbackUrl: '/auth/callback',
    middlewareBaseUrl: 'http://localhost:4000',    // ordamy-middleware
    mockAuth: true,                         // true = bypass SSO & Permissions locally
    jwksUrl: 'http://localhost:3000/.well-known/jwks.json',
};
