import sys

file_path = 'c:/Users/Jade/Downloads/github/ALMOST PERFECT LOST AND FOUND (2)/ALMOST PERFECT LOST AND FOUND/server/routes/items.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "db.run(`INSERT INTO users (user_id, email) VALUES (?, ?) ON CONFLICT (user_id) DO NOTHING`,\n                ['guest', 'guest@example.com']",
    "db.run(`INSERT INTO users (user_id, email, role, points) VALUES (?, ?, 'user', 0) ON CONFLICT (user_id) DO NOTHING`,\n                ['guest', 'guest@example.com']"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
