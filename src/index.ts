import cron from 'node-cron';
import mongoose from 'mongoose';
import { PorkbunProvider } from './providers/porkbun-provider';
import { DdnsManager } from './services/ddns-manager';

await mongoose.connect(process.env.MONGODB_URI!);

const provider = new PorkbunProvider({
  apiKey: process.env.PORKBUN_API_KEY!,
  secretKey: process.env.PORKBUN_SECRET!,
});

const manager = new DdnsManager(provider);

cron.schedule('*/10 * * * *', () => manager.run());
