import { DnsProvider } from './ddns-provider';

interface PorkbunCredentials {
  apiKey: string;
  secretKey: string;
}

type LogLevel = 'info' | 'success' | 'error' | 'warn';

export class PorkbunProvider implements DnsProvider {
  private creds: PorkbunCredentials;
  private ttl: string = '600';
  private typeRecord: string = 'A';

  constructor(creds: PorkbunCredentials) {
    this.creds = creds;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [Porkbun]`;

    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

    switch (level) {
      case 'error':
        console.error(`${prefix} ❌ ${message}${metaStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️  ${message}${metaStr}`);
        break;
      case 'success':
        console.log(`${prefix} ✓ ${message}${metaStr}`);
        break;
      default:
        console.log(`${prefix} ${message}${metaStr}`);
    }
  }

  private async createRecord(domain: string, subdomain: string, ip: string): Promise<void> {
    const endpoint = process.env.DNS_PROVIDER_CREATE_SUBDOMAIN_ENDPOINT!.replace(
      '{{domain}}',
      domain
    );

    this.log('info', 'Creating DNS record', { subdomain, ip });

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: this.creds.apiKey,
          secretapikey: this.creds.secretKey,
          name: subdomain,
          type: this.typeRecord,
          content: ip,
          ttl: this.ttl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        this.log('error', 'Failed to create DNS record', {
          subdomain,
          status: res.status,
          response: data,
        });
        throw new Error(`Failed to create record: ${data.message || res.statusText}`);
      }

      this.log('success', 'DNS record created', {
        subdomain,
        ip,
        status: res.status,
      });
    } catch (error) {
      this.log('error', 'Error creating DNS record', {
        subdomain,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async updateRecord(domain: string, subdomain: string, ip: string): Promise<void> {
    const endpoint = process.env
      .DNS_PROVIDER_EDIT_SUBDOMAIN_ENDPOINT!.replace('{{domain}}', domain)
      .replace('{{type}}', this.typeRecord)
      .replace('{{subdomain}}', subdomain);

    this.log('info', 'Updating DNS record', { subdomain, ip });

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: this.creds.apiKey,
          secretapikey: this.creds.secretKey,
          content: ip,
          ttl: this.ttl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        this.log('error', 'Failed to update DNS record', {
          subdomain,
          status: res.status,
          response: data,
        });
        throw new Error(`Failed to update record: ${data.message || res.statusText}`);
      }

      this.log('success', 'DNS record updated', {
        subdomain,
        ip,
        status: res.status,
      });
    } catch (error) {
      this.log('error', 'Error updating DNS record', {
        subdomain,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async checkRecordExists(
    domain: string,
    subdomain: string
  ): Promise<{ exists: boolean; currentIp?: string }> {
    const endpoint = process.env
      .DNS_PROVIDER_GET_SUBDOMAIN_ENDPOINT!.replace('{{domain}}', domain)
      .replace('{{type}}', this.typeRecord)
      .replace('{{subdomain}}', subdomain);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretapikey: this.creds.secretKey,
          apikey: this.creds.apiKey,
        }),
      });

      if (!res.ok) {
        // 404 or other errors mean it doesn't exist
        return { exists: false };
      }

      const data = await res.json();

      if (data.status === 'SUCCESS' && data.records && data.records.length > 0) {
        // Return the current IP so you can compare it
        return {
          exists: true,
          currentIp: data.records[0].content,
        };
      }

      return { exists: false };
    } catch (error) {
      this.log('warn', 'Error checking record existence', {
        subdomain,
        error: error instanceof Error ? error.message : String(error),
      });
      // Assume it doesn't exist if we can't check
      return { exists: false };
    }
  }

  async handleRecords(domain: string, subdomains: string[], ip: string): Promise<void> {
    this.log('info', 'Starting DNS record updates', {
      domain,
      subdomainCount: subdomains.length,
      ip,
    });

    for (const subdomain of subdomains) {
      try {
        const { exists } = await this.checkRecordExists(domain, subdomain);
        if (exists) {
          await this.updateRecord(domain, subdomain, ip);
        } else {
          this.log('info', 'Subdomain does not exist, creating new record', { subdomain });
          await this.createRecord(domain, subdomain, ip);
        }
      } catch (error) {
        // Log but continue with other subdomains
        this.log('error', 'Failed to handle subdomain', {
          subdomain,
          error: error instanceof Error ? error.message : String(error),
        });
        // Optionally: collect errors and throw at the end if any failed
      }
    }

    this.log('success', 'DNS record updates completed', {
      domain,
      subdomainCount: subdomains.length,
    });
  }
}
