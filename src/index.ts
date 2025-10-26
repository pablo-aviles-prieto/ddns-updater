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
  let db: MongoDBAdapter | null = null;
  try {
    // Initialize database adapter
    db = new MongoDBAdapter(process.env.DB_URI!);
    await connectToDatabase(db);

    // Initialize DNS provider
    const provider = new PorkbunProvider({
      apiKey: process.env.DNS_PROVIDER_API_KEY!,
      secretKey: process.env.DNS_PROVIDER_SECRET_KEY!,
    });

    // Initialize DDNS manager
    const manager = new DdnsManager(provider, db);

    await runDdnsUpdate(manager);

    console.log('✓ DDNS service executed.');
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exitCode = 1;
  } finally {
    if (db) {
      try {
        await db.disconnect();
      } catch (err) {
        console.error('Error disconnecting DB:', err);
      }
    }
  }
}

main();
