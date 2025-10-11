import cron from 'node-cron';
import { PorkbunProvider } from './providers/porkbun-provider';
import { DdnsManager } from './services/ddns-manager';
import { withRetry } from './utils';
import { DatabaseAdapter } from './db/database-adapter';
import { MongoDBAdapter } from './db/mongodb/mongoose-adapter';

async function connectToDatabase(db: DatabaseAdapter): Promise<void> {
  await withRetry(
    () => db.connect(),
    { maxAttempts: 5, delayMs: 2000, backoffMultiplier: 2 },
    'Database Connection'
  );
  console.log('✓ Connected to database');
}

async function runDdnsUpdate(manager: DdnsManager): Promise<void> {
  await withRetry(() => manager.run(), { maxAttempts: 3, delayMs: 5000 }, 'DDNS Update');
}

async function main() {
  try {
    // Initialize database adapter
    const db = new MongoDBAdapter(process.env.DB_URI!);
    await connectToDatabase(db);

    // Initialize DNS provider
    const provider = new PorkbunProvider({
      apiKey: process.env.DNS_PROVIDER_API_KEY!,
      secretKey: process.env.DNS_PROVIDER_SECRET_KEY!,
    });

    // Initialize DDNS manager
    const manager = new DdnsManager(provider, db);

    // Initial run with retry
    await runDdnsUpdate(manager);

    // Schedule periodic updates
    cron.schedule('*/10 * * * *', async () => {
      try {
        await runDdnsUpdate(manager);
      } catch (error) {
        console.error('Scheduled DDNS update failed:', error);
      }
    });

    console.log('✓ DDNS service started. Updates scheduled every 10 minutes.');
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

main();
