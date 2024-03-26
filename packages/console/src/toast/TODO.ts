import { toast } from 'react-hot-toast';
import { warn } from '@/toast/warn';

export function TODO(msg = 'TODO') {
  // once
  warn(msg) || toast.success(`TODO: ${msg}`);
}
