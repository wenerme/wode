import { Renderable, toast } from 'react-hot-toast';
import { warn } from '@/toast/warn';

export function showSuccessToast(msg: Renderable | { message: string }) {
  let c: Renderable = msg && typeof msg === 'object' && 'message' in msg ? msg.message : msg;
  if (!c) {
    warn('showSuccessToast: msg is empty');
  }
  c ||= '成功!';
  toast.success(c);
}
