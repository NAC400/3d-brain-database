/** UUIDs are required by the Supabase schema and are safe to generate client-side. */
export function newId(): string {
  return crypto.randomUUID();
}
