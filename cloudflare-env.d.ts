declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    AUTH_SECRET?: string;
    ADMIN_EMAIL?: string;
    ADMIN_PASSWORD?: string;
    DEMO_MODE?: string;
  }
}
