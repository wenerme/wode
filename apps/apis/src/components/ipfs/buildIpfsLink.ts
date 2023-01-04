export function buildIpfsLink({ gateway = 'https://ipfs.io/ipfs/:hash', hash }: { gateway?: string; hash: string }) {
  return gateway.replace(':hash', hash);
}
