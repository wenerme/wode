import { toast } from 'react-hot-toast';

export function TODO(msg = 'TODO') {
  if (!once) {
    once = new Set<string>();
  }
  if (once.has(msg)) return;
  once.add(msg);
  toast.success(`TODO: ${msg}`);
}

let once: Set<string>;
