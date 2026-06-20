export const environment = {
    production: true,
    ssoCoreUrl: 'https://sso-core-dev.bigso.co',
    ssoPortalUrl: 'https://sso-dev.bigso.co',
    appId: 'ad7b4e78-a856-486e-9f4c-9fe0a73eb780',//TODO: implementar in edpoint /api/config en el middleware pra que sirva este valor y solo configurrlo en el middleware
    baseUrl: 'https://ordamy-dev.bigso.co',
    callbackUrl: '/auth/callback',
    middlewareBaseUrl: 'https://ordamy-middleware-dev.bigso.co',
    jwksUrl: 'https://sso-core-dev.bigso.co/.well-known/jwks.json',
    analytics: {
        enabled: true,
        provider: 'umami' as const,
        scriptUrl: 'https://umami.msoft.uno/script.js',
        websiteId: '9b892ba1-be72-4e4e-bc68-6d81c0a6e43f',
        autoTrack: false,
    },
};
