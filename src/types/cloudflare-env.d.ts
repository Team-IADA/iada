// Augment the global CloudflareEnv declared by @opennextjs/cloudflare
// to include our D1 binding.
declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

export {};
