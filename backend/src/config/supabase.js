const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

const supabaseAdmin = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const supabasePublic = createClient(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testSupabaseConnection() {
  const { error } = await supabaseAdmin
    .from("users")
    .select("id")
    .limit(1);

  if (error) {
    return {
      connected: false,
      error: error.message
    };
  }

  return {
    connected: true,
    error: null
  };
}

async function testStorageConnection() {
  const { error } = await supabaseAdmin.storage
    .from(env.supabase.storageBucket)
    .list("", { limit: 1 });

  if (error) {
    return {
      connected: false,
      bucket: env.supabase.storageBucket,
      error: error.message
    };
  }

  return {
    connected: true,
    bucket: env.supabase.storageBucket,
    error: null
  };
}

module.exports = {
  supabaseAdmin,
  supabasePublic,
  testSupabaseConnection,
  testStorageConnection
};