import { Schema, model } from 'mongoose';
import { SettingsData } from '../database-adapter';

const settingsSchema = new Schema<SettingsData>(
  {
    domain: { type: String, required: true },
    subdomains: { type: [String], required: true },
    ipEndpoint: { type: String, required: true },
    lastIp: { type: String, default: '' },
  },
  {
    timestamps: {
      createdAt: false,
      updatedAt: true,
    },
  }
);

export const SettingsModel = model<SettingsData>('Settings', settingsSchema);
