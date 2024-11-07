import { makeAutoObservable, action } from "mobx";
import {
  BedSettings,
  ProbeSettings,
  OtaSettings,
  GrblSettings,
  RelaySettings,
  ControllerSettings,
  BedControlMode
} from "../types/Settings";
import { OutgoingMessageType } from "../types/Messages";
import { ISerialService } from "../services/interfaces/ISerialService";
import { ToastStore } from "./ToastStore";

export class SettingsStore {
  private toastStore: ToastStore;
  private serialService: ISerialService | null = null;
  private updateTimeout: NodeJS.Timeout | null = null;

  _bed: BedSettings = { control_mode: BedControlMode.Grbl };
  _probes: ProbeSettings = {};
  _ota: OtaSettings = {};
  _grbl: GrblSettings = {};
  _relays: RelaySettings = {};
  _isLoaded: boolean = false;

  constructor(toastStore: ToastStore) {
    this.toastStore = toastStore;
    makeAutoObservable(this);
  }

  get bed() {
    return this._bed;
  }

  get probes() {
    return this._probes;
  }

  get ota() {
    return this._ota;
  }

  get grbl() {
    return this._grbl;
  }

  get relays() {
    return this._relays;
  }

  get isLoaded() {
    return this._isLoaded;
  }

  setSerialService = action((service: ISerialService) => {
    this.serialService = service;
  });

  cleanup = () => {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  };

  setIsLoaded = action((loaded: boolean) => {
    this._isLoaded = loaded;
  });

  updateSettings = action((settings: ControllerSettings) => {
    if (settings.bed) {
      this._bed = this.deepMerge(this._bed, settings.bed);
    }
    if (settings.probes) {
      this._probes = this.deepMerge(this._probes, settings.probes);
    }
    if (settings.ota) {
      this._ota = this.deepMerge(this._ota, settings.ota);
    }
    if (settings.grbl) {
      this._grbl = this.deepMerge(this._grbl, settings.grbl);
    }
    if (settings.relays) {
      this._relays = this.deepMerge(this._relays, settings.relays);
    }

    // Send only the changed settings
    this.debouncedSendUpdate(settings);
  });

  private debouncedSendUpdate = (settings: Partial<ControllerSettings>) => {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(async () => {
      try {
        if (!this.serialService) {
          throw new Error('Serial service not initialized');
        }

        await this.serialService.sendMessage({
          a: OutgoingMessageType.SettingsSet,
          p: settings
        });
      } catch (error) {
        this.toastStore.show(
          'Settings Update Failed',
          `Failed to send settings update to the controller: ${error.message}`,
          'danger'
        );
      }
    }, 1000);
  };

  private deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      const value = source[key];
      if (value === undefined) continue;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.deepMerge(target[key] || {} as any, value as any);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
