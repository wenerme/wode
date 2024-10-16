import { toast } from 'react-hot-toast';
import { resolveErrorMessage } from './resolveErrorMessage';

export function showErrorToast(error: Error | any) {
  if (!error) {
    return;
  }
  toast.error(resolveErrorMessage(error));
}
