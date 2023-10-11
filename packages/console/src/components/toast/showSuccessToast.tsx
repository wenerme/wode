import { toast } from 'react-hot-toast';

export function showSuccessToast(msg: string) {
  toast.success(msg);
}
