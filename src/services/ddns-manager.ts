import { DatabaseAdapter } from '../db/database-adapter';
import { DnsProvider } from '../providers/ddns-provider';
import { timestamp } from '../utils';
import { getPublicIP } from './ip-fetcher';

export class DdnsManager {
  private provider: DnsProvider;
  private db: DatabaseAdapter;

  constructor(provider: DnsProvider, db: DatabaseAdapter) {
    this.provider = provider;
    this.db = db;
  }

  async run() {
    let settings = await this.db.getSettings();
    if (!settings) {
      const defaultSubdomains = process.env.DEFAULT_SUBDOMAINS?.split(',') || [];
      settings = await this.db.createSettings({
        domain: process.env.DEFAULT_DOMAIN || 'example.com',
        subdomains: defaultSubdomains,
        ipEndpoint: process.env.DEFAULT_IP_ENDPOINT || 'https://api.ipify.org',
        lastIp: '',
      });
    }

    const currentIp = await getPublicIP(settings.ipEndpoint);

    if (currentIp !== settings.lastIp) {
      console.log(`[${timestamp()}] [DDNS] IP changed: ${settings.lastIp} -> ${currentIp}`);
      await this.provider.handleRecords(settings.domain, settings.subdomains, currentIp);
      settings.lastIp = currentIp;
      await this.db.updateSettings(settings);
    } else {
      console.log(`[${timestamp()}] [DDNS] IP unchanged (${currentIp})`);
    }
  }
}
