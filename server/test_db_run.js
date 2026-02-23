const db = require('./db/db');

async function run() {
    try {
        const sql = 'INSERT INTO found_items (user_id, title, description, category, location, date_found) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
        const params = ['guest', 'test_script_item', 'none', 'wallet', 'nowhere', new Date().toISOString()];

        db.run(sql, params, async function (err) {
            if (err) {
                console.error("DB RUN ERR:", err);
            } else {
                console.log("SUCCESS. this.lastID =", this.lastID);
                console.log("context keys:", Object.keys(this));
            }
            process.exit(0);
        });
    } catch (e) {
        console.error("CATCH ERR:", e);
    }
}
run();
