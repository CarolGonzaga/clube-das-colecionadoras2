import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error("Please add SUPABASE_SERVICE_ROLE_KEY to your .env file to create test users.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("Starting test users seeding...");

  // Define users
  const usersToCreate = [
    { email: "vazio@teste.com", password: "1234", nick: "Usuária Vazia", type: "empty" },
    { email: "completo@teste.com", password: "1234", nick: "Usuária Completa", type: "full" },
  ];

  for (const u of usersToCreate) {
    console.log(`\nProcessing user: ${u.email}...`);

    // Check if user exists (by listing users, or we can just try to create and catch, but admin api is tricky)
    // Actually, admin.createUser fails if email exists. We can delete if exists first.

    // Find user by email (using listUsers)
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError.message);
      continue;
    }

    const existingUser = usersData.users.find((x) => x.email === u.email);
    if (existingUser) {
      console.log(`User ${u.email} already exists. Deleting to recreate...`);
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }

    // Create user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { nick: u.nick, mural_opt_in: true },
    });

    if (createError || !authData.user) {
      console.error(`Failed to create ${u.email}:`, createError?.message);
      continue;
    }

    const userId = authData.user.id;
    console.log(`Successfully created Auth user ${u.email} (ID: ${userId})`);

    // Wait 1 second to ensure DB triggers (like profile creation) have finished
    await new Promise((res) => setTimeout(res, 1000));

    if (u.type === "full") {
      console.log(`Populating full album for ${u.email}...`);

      // 1. Grant 100 stickers (copies = 2)
      const stickersToInsert = [];
      for (let i = 1; i <= 100; i++) {
        stickersToInsert.push({
          user_id: userId,
          sticker_number: i,
          copies: 2,
          is_rare: i % 12 === 0 || i === 7,
        });
      }

      const { error: insertError } = await supabaseAdmin
        .from("user_stickers")
        .insert(stickersToInsert);

      if (insertError) {
        console.error("Error inserting stickers:", insertError.message);
      } else {
        console.log("Successfully inserted 100 stickers!");
      }

      // 2. Grant all reward grants
      const rewards = [
        "tag_baldaverso",
        "tag_frutaverso",
        "tag_brightfalls",
        "tag_hq",
        "tag_opostos",
        "mission_whatsapp",
        "mission_x",
        "mission_instagram",
        "mission_tiktok",
        "mission_copy-link",
        "quiz_10",
        "quiz_16",
        "quiz_35",
        "quiz_49",
        "quiz_72",
      ];

      const grantsToInsert = rewards.map((rk) => ({
        user_id: userId,
        reward_key: rk,
      }));

      const { error: grantsError } = await supabaseAdmin
        .from("reward_grants")
        .insert(grantsToInsert);

      if (grantsError) {
        console.error("Error inserting reward grants:", grantsError.message);
      } else {
        console.log("Successfully inserted reward grants!");
      }

      // 3. Update all user styles to unlocked
      const { error: stylesError } = await supabaseAdmin
        .from("user_styles")
        .update({ unlocked: true })
        .eq("user_id", userId);

      if (stylesError) {
        console.error("Error unlocking styles:", stylesError.message);
      } else {
        console.log("Successfully unlocked all styles!");
      }
    } else {
      console.log(`User ${u.email} is meant to be empty. No stickers added.`);
    }
  }

  console.log("\nFinished seeding test users!");
}

main().catch(console.error);
