declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;

    APP_BASE_URL?: string;
    ENVIRONMENT?: "development" | "preview" | "production";
    AUTH_DEV_EMAIL_LOG?: string;
    AUTH_TRUST_HOSTED_IDENTITY_HEADERS?: string;
    AUTH_TRUST_PROXY_IP_HEADERS?: string;

    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_REDIRECT_URI?: string;

    EMAIL_FROM?: string;
    RESEND_API_KEY?: string;

    ANIME_CLASH_ADMIN_USER_ID?: string;
    ANIME_CLASH_ADMIN_ID?: string;
  }
}
