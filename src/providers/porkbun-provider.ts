import { DnsProvider } from './ddns-provider';

interface PorkbunCredentials {
  apiKey: string;
  secretKey: string;
}

export class PorkbunProvider implements DnsProvider {
  private creds: PorkbunCredentials;

  constructor(creds: PorkbunCredentials) {
    this.creds = creds;
  }

  async updateRecords(domain: string, subdomains: string[], ip: string): Promise<void> {
    for (const sub of subdomains) {
      await fetch('https://porkbun.com/api/json/v3/dns/editByNameType', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: this.creds.apiKey,
          secretapikey: this.creds.secretKey,
          name: sub,
          type: 'A',
          content: ip,
          domain,
        }),
      });
    }
  }
}
