import { Schema, model } from 'mongoose';

interface Settings {
  domain: string; // e.g. "pabloaviles.dev"
  subdomains: Array<string>; // e.g. ["ts", "scrapeit", "api"]
  ipEndpoint: string; // e.g. "https://api.ipify.org"
  lastIp: string; // the last saved IP
  lastUpdated: Date;
}

const settingsSchema = new Schema<Settings>({
  domain: { type: String, required: true },
  subdomains: { type: [String], required: true },
  ipEndpoint: { type: String, required: true },
  lastIp: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now },
});

export const SettingsModel = model<Settings>('Settings', settingsSchema);
