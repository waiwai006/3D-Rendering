import { Auth0Client } from "@auth0/nextjs-auth0/server";

const domain = process.env.AUTH0_DOMAIN ?? process.env.AUTH_DOMAIN;
const clientId = process.env.AUTH0_CLIENT_ID ?? process.env.AUTH_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET ?? process.env.AUTH_CLIENT_SECRET;
const secret = process.env.AUTH0_SECRET;
const appBaseUrl = process.env.APP_BASE_URL;

export const auth0Configured = Boolean(
  domain && clientId && clientSecret && secret && appBaseUrl,
);

export const auth0 = auth0Configured
  ? new Auth0Client({
      appBaseUrl,
      clientId,
      clientSecret,
      domain,
      secret,
    })
  : null;
