export interface SettingsData {
  domain: string; // e.g. "pabloaviles.dev"
  subdomains: string[]; // e.g. ["ts", "scrapeit", "api"]
  ipEndpoint: string; // e.g. "https://api.ipify.org"
  lastIp: string; // the last saved IP
}

export abstract class DatabaseAdapter {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;

  abstract getSettings(): Promise<SettingsData | null>;
  abstract createSettings(data: SettingsData): Promise<SettingsData>;
  abstract updateSettings(data: Partial<SettingsData>): Promise<SettingsData>;
}
