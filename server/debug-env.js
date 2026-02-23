require('dotenv').config();
console.log('Current directory:', process.cwd());
console.log('ENABLE_EMAIL_NOTIFICATIONS:', process.env.ENABLE_EMAIL_NOTIFICATIONS);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
