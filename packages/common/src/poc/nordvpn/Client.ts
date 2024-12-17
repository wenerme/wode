import type { Server, ServerCountry } from './types';

export class Client {
  getServerCountries(): Promise<ServerCountry[]> {
    return fetch('https://api.nordvpn.com/v1/servers/countries').then((v) => v.json());
  }

  getServerRecommendations(): Promise<Server[]> {
    return fetch('https://api.nordvpn.com/v1/servers/recommendations').then((v) => v.json());
  }

  getServers(): Promise<Server[]> {
    return fetch('https://api.nordvpn.com/v1/servers?limit=9999999').then((v) => v.json());
  }
}
