import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { ensureForm, FORM_STATUS_MESSAGES } from './services/form.service.js';
import { ensureAdmin } from './services/user.service.js';

const PORT = process.env.PORT;

await connectDB();
const formStatus = await ensureForm();
if (formStatus) console.log(`Form ${FORM_STATUS_MESSAGES[formStatus]}`);

const defaultAdmin = await ensureAdmin();
if (defaultAdmin) console.log(`No admin found: "${defaultAdmin}" is now an admin`);

app.listen(PORT, () => 
    console.log(`Server running on port ${PORT}`)
);