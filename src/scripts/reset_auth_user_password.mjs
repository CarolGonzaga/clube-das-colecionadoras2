import { createClient } from "@supabase/supabase-js";

const [, , emailArg, pinArg = "1234"] = process.argv;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

if (!emailArg) {
  console.error("Usage: node src/scripts/reset_auth_user_password.mjs email@example.com 1234");
  process.exit(1);
}

if (!/^\d{4,}$/.test(pinArg)) {
  console.error("The PIN must contain at least 4 digits.");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = `${pinArg.trim()}CDCPIN`;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

if (listError) {
  console.error(`Could not list users: ${listError.message}`);
  process.exit(1);
}

const user = usersData.users.find((item) => item.email?.toLowerCase() === email);

if (!user) {
  console.error(`User not found: ${email}`);
  process.exit(1);
}

const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
  email_confirm: true,
  password,
  user_metadata: {
    ...(user.user_metadata || {}),
  },
});

if (error) {
  console.error(`Could not update user password: ${error.message}`);
  process.exit(1);
}

console.log(`Password reset through Supabase Admin API for ${data.user.email} (${data.user.id}).`);
console.log(`The user can now log in with PIN ${pinArg}.`);
