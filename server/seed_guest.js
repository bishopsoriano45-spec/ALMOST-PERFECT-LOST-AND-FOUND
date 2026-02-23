const db = require('./db/db');

// Schema has: user_id, email, phone_number, role, points, password_hash, created_at
// No 'name' column.

const sql = `
INSERT INTO users (user_id, email, role, password_hash)
VALUES ('guest', 'guest@example.com', 'user', 'guest_hash')
ON CONFLICT (user_id) DO NOTHING;
`;

db.run(sql, [], function (err) {
    if (err) {
        console.error('Error seeding guest user:', err);
    } else {
        console.log('Guest user seeded successfully');
    }
});
