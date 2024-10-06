export function getRequestSubject({ service, method }: { service: string; method: string }) {
  return `service.${service}.${method}`;
}

export function getSubscribeSubject({ service }: { service: string }) {
  return [
    `service.${service}`,
    `service.${service}.*`, // for method
  ];
}
