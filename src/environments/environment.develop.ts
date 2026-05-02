export const environment = {
    production: true,
    ssoCoreUrl: 'https://sso-core-dev.bigso.co',
    ssoPortalUrl: 'https://sso-dev.bigso.co',
    appId: '91021567-ec0b-42eb-9132-58bd66654119',//TODO: implementar in edpoint /api/config en el middleware pra que sirva este valor y solo configurrlo en el middleware
    baseUrl: 'https://ordamy-dev.bigso.co',
    callbackUrl: '/auth/callback',
    middlewareBaseUrl: 'https://ordamy-middleware-dev.bigso.co',
    jwksUrl: 'https://sso-core-dev.bigso.co/.well-known/jwks.json',
};
