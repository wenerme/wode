import { toast } from 'react-hot-toast';

export function TODO(msg = 'TODO') {
  if (once.has(msg)) return;
  once.add(msg);
  toast.success(`TODO: ${msg}`);
}
const once = new Set<string>();
