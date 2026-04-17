export const environment = {
    production: false,
    ssoCoreUrl: 'https://sso-core.bigso.test',       // SSO Core
    ssoPortalUrl: 'https://sso.bigso.test',        // SSO Portal
    appId: 'ad7b4e78-a856-486e-9f4c-9fe0a73eb780',
    baseUrl: 'https://ordamy.bigso.test',
    callbackUrl: '/auth/callback',
    middlewareBaseUrl: 'https://ordamy-back.bigso.test',    // ordamy-middleware
    mockAuth: true,                         // true = bypass SSO & Permissions locally
    jwksUrl: 'https://sso-core.bigso.test/.well-known/jwks.json',
};
