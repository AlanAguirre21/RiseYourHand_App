import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { ensureForm, FORM_STATUS_MESSAGES } from '../services/form.service.js';
import { ensureAdmin } from '../services/user.service.js';
import form from './form.json' with { type: 'json' };

try {
  await mongoose.connect(process.env.MONGO_URI);

  const formStatus = await ensureForm();
  console.log(`"${form.key}" v${form.version} ${FORM_STATUS_MESSAGES[formStatus] ?? 'is up to date'}`);

  // Drops indexes the schema no longer has (the old unique "username") and builds the unique "name" one
  await User.syncIndexes();
  const defaultAdmin = await ensureAdmin();
  console.log(defaultAdmin ? `No admin found: "${defaultAdmin}" is now an admin` : 'Admin user: already exists');
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
