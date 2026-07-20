import { createClient } from "@supabase/supabase-js";

const [, , emailArg, pinArg = "1234"] = process.argv;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  throw new Error("Missing Supabase environment variables.");
}

if (!emailArg) {
  console.error("Usage: node src/scripts/reset_auth_user_password.mjs email@example.com 1234");
  throw new Error("Missing email argument.");
}

if (!/^\d{4,}$/.test(pinArg)) {
  console.error("The PIN must contain at least 4 digits.");
  throw new Error("Invalid PIN.");
}

const email = emailArg.trim().toLowerCase();
const password = `${pinArg.trim()}CDCPIN`;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(targetEmail) {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Could not list users: ${error.message}`);
    }

    const user = data.users.find((item) => item.email?.trim().toLowerCase() === targetEmail);
    if (user) return user;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

const user = await findUserByEmail(email);

if (!user) {
  throw new Error(`User not found through Supabase Admin API: ${email}`);
}

const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
  email_confirm: true,
  password,
  user_metadata: {
    ...(user.user_metadata || {}),
  },
});

if (error) {
  throw new Error(`Could not update user password: ${error.message}`);
}

console.log(`Password reset through Supabase Admin API for ${data.user.email} (${data.user.id}).`);
console.log(`The user can now log in with PIN ${pinArg}.`);
