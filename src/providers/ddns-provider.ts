export abstract class DnsProvider {
  abstract handleRecords(domain: string, subdomains: string[], ip: string): Promise<void>;
}
