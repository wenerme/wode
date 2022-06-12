import uas from './useragent-data.json';

const UserAgents = uas as any as UserAgentData[];
const empty = {
  folder: '',
  description: '',
  userAgent: '',
  appCodename: '',
  appName: '',
  appVersion: '',
  platform: '',
  vendor: '',
  vendorSub: '',
  browserName: '',
  browserMajor: '',
  browserVersion: '',
  deviceModel: '',
  deviceType: '',
  deviceVendor: '',
  engineName: '',
  engineVersion: '',
  osName: '',
  osVersion: '',
  cpuArchitecture: '',
};
export type UserAgentData = typeof empty;

const getData = function (filter?: (v: UserAgentData, i: number) => boolean) {
  return typeof filter === 'function' ? UserAgents.filter(filter) : UserAgents;
};

export function getRandom(filter?: (v: UserAgentData, i: number) => boolean) {
  const data = getData(filter);
  return data.length ? data[Math.floor(Math.random() * data.length)].userAgent : null;
}
