/**
 * Generates data/users.json with bcrypt-hashed passwords.
 * Edit the USERS array below before running.
 *
 * Usage:
 *   node scripts/seed-users.js
 *
 * WARNING: Running this again will overwrite data/users.json.
 * Any passwords changed through the app will be lost.
 */

const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Edit usernames and default passwords before running.
const USERS = [
  { username: "user1", password: "changeme" },
  { username: "user2", password: "changeme" },
  { username: "user3", password: "changeme" },
  { username: "user4", password: "changeme" },
];

const BCRYPT_ROUNDS = 12;

async function seed() {
  const hashed = await Promise.all(
    USERS.map(async ({ username, password }) => ({
      username: username.toLowerCase(),
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    }))
  );

  const dataDir = path.join(__dirname, "..", "data");
  const contactsDir = path.join(dataDir, "contacts");

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(contactsDir, { recursive: true });

  const outPath = path.join(dataDir, "users.json");
  fs.writeFileSync(outPath, JSON.stringify(hashed, null, 2));

  // Create a contacts file for each user (skip if already exists to preserve data)
  hashed.forEach(({ username }) => {
    const safe = username.replace(/[^a-zA-Z0-9_]/g, "_");
    const contactsFile = path.join(contactsDir, `${safe}.json`);
    if (!fs.existsSync(contactsFile)) {
      fs.writeFileSync(contactsFile, "[]");
    }
  });

  console.log("data/users.json created:");
  hashed.forEach((u) => console.log(`  ${u.username}`));
  console.log(`Default password: changeme`);
  console.log("Each user should change their password via /settings.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
