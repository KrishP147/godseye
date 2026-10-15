import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Without Supabase credentials the app still runs: realtime subscriptions do
// nothing and queries resolve to empty results, so pages fall back to the API.
function createNoopClient(): SupabaseClient {
  const channel = {
    on: () => channel,
    subscribe: () => channel,
    unsubscribe: async () => "ok" as const,
  };

  const query = {
    select: () => query,
    eq: () => query,
    then: <T>(resolve: (value: { data: null; error: null }) => T) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
  };

  return {
    channel: () => channel,
    removeChannel: async () => "ok" as const,
    from: () => query,
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createNoopClient();
