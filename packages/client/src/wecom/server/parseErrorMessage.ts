export function parseErrorMessage(m?: string) {
  if (!m) {
    return undefined;
  }
  const r = /(?<description>.*?), hint: \[(?<requestId>[^\]]+)].*?from ip: (?<ip>[^,]*?), more info at (?<url>.*)/;
  // avoid use message as key, conflict with Error.message
  const { description, requestId, ip, url } = m.match(r)?.groups ?? {};
  if (!ip) {
    return undefined;
  }
  return { description, requestId, ip, url };
}
