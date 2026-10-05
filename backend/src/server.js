import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { ensureForm } from './services/form.service.js';
import { ensureAdmin } from './services/user.service.js';

const PORT = process.env.PORT || 3000;

await connectDB();
if (await ensureForm()) console.log('Form created from seed/form.json');

const defaultAdmin = await ensureAdmin();
if (defaultAdmin) console.log(`No admin found: "${defaultAdmin}" is now an admin`);

app.listen(PORT, () => 
    console.log(`Server running on port ${PORT}`)
);