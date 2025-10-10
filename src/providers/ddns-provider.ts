export abstract class DnsProvider {
  abstract updateRecords(domain: string, subdomains: string[], ip: string): Promise<void>;
}
