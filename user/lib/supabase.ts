import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This uses the public anon key, so it only ever sees what RLS allows
// an unauthenticated visitor to see — published articles and categories.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
