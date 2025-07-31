/**
 * Seed default users and marketplace data using supabaseAdmin
 */

const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { supabaseAdmin } = require('../server/utils/database');

dotenv.config();

const adminUsername = process.env.SEED_ADMIN_USERNAME;
const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const userUsername = process.env.SEED_USER_USERNAME;
const userEmail = process.env.SEED_USER_EMAIL;
const userPassword = process.env.SEED_USER_PASSWORD;

const users = [
  adminUsername && adminEmail && adminPassword && {
    username: adminUsername,
    email: adminEmail,
    password: adminPassword,
    displayName: process.env.SEED_ADMIN_DISPLAY_NAME || 'Admin',
    role: 'admin'
  },
  userUsername && userEmail && userPassword && {
    username: userUsername,
    email: userEmail,
    password: userPassword,
    displayName: process.env.SEED_USER_DISPLAY_NAME || 'User'
  }
].filter(Boolean);

const marketItems = [
  {
    title: 'Sample Widget',
    description: 'A simple widget for demonstration',
    category: 'widget',
    content: '<div class="sample-widget">Sample Widget</div>',
    wirPrice: 5,
    tags: ['sample'],
    creator: adminUsername
  },
  {
    title: 'Sample Template',
    description: 'Basic profile template',
    category: 'template',
    content: '<div class="sample-template">Template</div>',
    wirPrice: 0,
    tags: ['template'],
    creator: userUsername
  }
];

async function seedDefaults() {
  try {
    console.log('Seeding default users...');
    const userIds = {};

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          username: user.username,
          email: user.email,
          password: hashedPassword,
          display_name: user.displayName,
          role: user.role || 'user'
        })
        .select('id')
        .single();

      if (error) throw error;
      userIds[user.username] = data.id;
      console.log(`Created user ${user.username}`);
    }

    console.log('Seeding marketplace items...');
    for (const item of marketItems) {
      const { error } = await supabaseAdmin.from('market_items').insert({
        title: item.title,
        description: item.description,
        category: item.category,
        content: item.content,
        wir_price: item.wirPrice,
        tags: item.tags,
        creator_id: userIds[item.creator],
        marketplace_status: 'available'
      });

      if (error) throw error;
      console.log(`Added item ${item.title}`);
    }

    console.log('Seeding completed successfully');
    return { success: true };
  } catch (err) {
    console.error('Error seeding defaults:', err);
    return { success: false, error: err.message };
  }
}

if (require.main === module) {
  seedDefaults()
    .then(result => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedDefaults;
