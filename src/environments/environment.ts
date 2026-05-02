export const environment = {
    production: false,
    ssoCoreUrl: 'https://sso-core.bigso.test',       // SSO Core
    ssoPortalUrl: 'https://sso.bigso.test',        // SSO Portal
    appId: '91021567-ec0b-42eb-9132-58bd66654119',
    baseUrl: 'https://ordamy.bigso.test',
    callbackUrl: '/auth/callback',
    middlewareBaseUrl: 'https://ordamy-back.bigso.test',    // ordamy-middleware
    mockAuth: true,                         // true = bypass SSO & Permissions locally
    jwksUrl: 'https://sso-core.bigso.test/.well-known/jwks.json',
};
