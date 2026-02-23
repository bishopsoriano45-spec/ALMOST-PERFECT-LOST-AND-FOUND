const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

console.log('Dist Path:', distPath);
console.log('Index Path:', indexPath);
console.log('Index exists:', fs.existsSync(indexPath));

app.use(express.static(distPath));

app.use((req, res) => {
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send(err.message);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Test Server is running on http://localhost:${PORT}`);
});
