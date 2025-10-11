import mongoose from 'mongoose';
import { DatabaseAdapter, SettingsData } from '../database-adapter';
import { SettingsModel } from './settings-model';

export class MongoDBAdapter extends DatabaseAdapter {
  private uri: string;

  constructor(uri: string) {
    super();
    this.uri = uri;
  }

  async connect(): Promise<void> {
    await mongoose.connect(this.uri);
    this.setupEventListeners();
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  private setupEventListeners(): void {
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected');
    });

    mongoose.connection.on('error', err => {
      console.error('MongoDB error:', err);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✓ MongoDB reconnected');
    });
  }

  async getSettings(): Promise<SettingsData | null> {
    const settings = await SettingsModel.findOne();
    return settings ? settings.toObject() : null;
  }

  async createSettings(data: SettingsData): Promise<SettingsData> {
    const settings = await SettingsModel.create({
      domain: data.domain,
      subdomains: data.subdomains,
      ipEndpoint: data.ipEndpoint,
      lastIp: data.lastIp,
    });
    return settings.toObject();
  }

  async updateSettings(data: Partial<SettingsData>): Promise<SettingsData> {
    const settings = await SettingsModel.findOneAndUpdate(
      {},
      { $set: data },
      { new: true, upsert: false }
    );
    if (!settings) {
      throw new Error('Settings not found');
    }
    return settings.toObject();
  }
}
