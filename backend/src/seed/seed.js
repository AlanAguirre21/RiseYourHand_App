import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { ensureForm, FORM_STATUS_MESSAGES } from '../services/form.service.js';
import { ensureAdmin, ensureDefaultChampions } from '../services/user.service.js';
import { ensureFolios } from '../services/response.service.js';
import Response from '../models/Response.js';
import form from './form.json' with { type: 'json' };

try {
  await mongoose.connect(process.env.MONGO_URI);

  const formStatus = await ensureForm();
  console.log(`"${form.key}" v${form.version} ${FORM_STATUS_MESSAGES[formStatus] ?? 'is up to date'}`);

  // Drops indexes the schema no longer has (the old unique "username") and builds the unique "name" one
  await User.syncIndexes();
  const defaultAdmin = await ensureAdmin();
  console.log(defaultAdmin ? `No admin found: "${defaultAdmin}" is now an admin` : 'Admin user: already exists');

  const champions = await ensureDefaultChampions();
  console.log(champions.created.length
    ? `Default champions created: ${champions.created.join(', ')}`
    : 'Default champions: nothing to create');
  for (const { name, reason } of champions.failed) console.warn(`Default champion "${name}" not created: ${reason}`);

  // Builds the unique "folio" index, then numbers the responses saved before it existed
  await Response.syncIndexes();
  const numbered = await ensureFolios();
  console.log(numbered ? `Folio given to ${numbered} older responses` : 'Folios: every response has one');
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
