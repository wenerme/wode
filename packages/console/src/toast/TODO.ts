import { toast } from 'react-hot-toast';
import { warn } from './warn';

export function TODO(msg = 'TODO') {
  // once
  warn(msg) || toast.success(`TODO: ${msg}`);
}
