import { DnsProvider } from './ddns-provider';

interface PorkbunCredentials {
  apiKey: string;
  secretKey: string;
}

// TODO: Add subdomain checker and creation if not exists.
// Mantain the updateRecords (change to private) and add a public method to do all the process
// (check subdomain existence and create if not exists or if exists just update record)
export class PorkbunProvider implements DnsProvider {
  private creds: PorkbunCredentials;

  constructor(creds: PorkbunCredentials) {
    this.creds = creds;
  }

  async updateRecords(domain: string, subdomains: string[], ip: string): Promise<void> {
    for (const sub of subdomains) {
      const res = await fetch(
        // TODO: Extract into env variable with replace
        `https://api.porkbun.com/api/json/v3/dns/editByNameType/${domain}/A/${sub}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apikey: this.creds.apiKey,
            secretapikey: this.creds.secretKey,
            content: ip,
            ttl: '600',
          }),
        }
      );
      console.log(
        '[Porkbun] Updated',
        sub,
        '->',
        ip,
        'Status:',
        res.status,
        'Response json:',
        await res.json()
      );
    }
  }
}
