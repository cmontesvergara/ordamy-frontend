export const environment = {
  production: true,
  ssoCoreUrl: 'https://idp.bigso.org',
  ssoPortalUrl: 'https://auth.bigso.org',
  appId: '077dcfcb-06f9-4997-9f82-c9bd8dce4c05', //preprod
  baseUrl: 'https://www.ordamy.com',
  callbackUrl: '/auth/callback',
  middlewareBaseUrl: 'https://middleware-prod.ordamy.com',
  jwksUrl: 'https://idp.bigso.org/.well-known/jwks.json',
  analytics: {
    enabled: true,
    provider: 'umami' as const,
    scriptUrl: 'https://umami.msoft.uno/script.js',
    websiteId: '9b892ba1-be72-4e4e-bc68-6d81c0a6e43f',
    autoTrack: false,
  },
};
