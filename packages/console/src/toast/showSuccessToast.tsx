import { toast } from 'react-hot-toast';
import { warn } from '@/toast/warn';

export function showSuccessToast(msg: string | { message: string }) {
  msg = typeof msg === 'string' ? msg : msg.message;
  if (!msg) {
    warn('showSuccessToast: msg is empty');
  }
  msg ||= '成功!';
  toast.success(msg);
}
