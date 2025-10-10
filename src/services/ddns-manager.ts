import { SettingsModel } from '../db/settings-model';
import { DnsProvider } from '../providers/ddns-provider';
import { getPublicIP } from './ip-fetcher';

export class DdnsManager {
  private provider: DnsProvider;

  constructor(provider: DnsProvider) {
    this.provider = provider;
  }

  async run() {
    let settings = await SettingsModel.findOne();
    if (!settings) {
      const defaultSubdomains = process.env.DEFAULT_SUBDOMAINS?.split(',') || [];
      settings = await SettingsModel.create({
        domain: process.env.DEFAULT_DOMAIN,
        subdomains: defaultSubdomains,
        ipEndpoint: process.env.DEFAULT_IP_ENDPOINT,
        lastIp: '',
      });
    }

    const currentIp = await getPublicIP(settings.ipEndpoint);

    if (currentIp !== settings.lastIp) {
      console.log(`[DDNS] IP changed: ${settings.lastIp} -> ${currentIp}`);
      await this.provider.updateRecords(settings.domain, settings.subdomains, currentIp);
      settings.lastIp = currentIp;
      settings.lastUpdated = new Date();
      await settings.save();
    } else {
      console.log(`[DDNS] IP unchanged (${currentIp})`);
    }
  }
}
