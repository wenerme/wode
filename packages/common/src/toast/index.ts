import { toast, Toaster } from 'react-hot-toast';

export { showErrorToast } from './showErrorToast';
export { toast, Toaster };

export function showToast(e: any) {
  if (!e) {
    return;
  }
  toast(typeof e === 'string' ? e : e?.message || String(e));
}
