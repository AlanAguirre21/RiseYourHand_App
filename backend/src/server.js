import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { ensureForm, FORM_STATUS_MESSAGES } from './services/form.service.js';
import { ensureAdmin, ensureDefaultChampions } from './services/user.service.js';
import { ensureFolios } from './services/response.service.js';

const PORT = process.env.PORT;

await connectDB();
const formStatus = await ensureForm();
if (formStatus) console.log(`Form ${FORM_STATUS_MESSAGES[formStatus]}`);

const defaultAdmin = await ensureAdmin();
if (defaultAdmin) console.log(`Default admin "${defaultAdmin}" created or restored`);

const champions = await ensureDefaultChampions();
if (champions.created.length) console.log(`Default champions created: ${champions.created.join(', ')}`);
if (champions.unmarked.length) console.log(`No longer champions (not in default_champions.json): ${champions.unmarked.join(', ')}`);
for (const { name, reason } of champions.failed) console.warn(`Default champion "${name}": ${reason}`);

const numbered = await ensureFolios();
if (numbered) console.log(`Folio given to ${numbered} older responses`);

app.listen(PORT, () => 
    console.log(`Server running on port ${PORT}`)
);