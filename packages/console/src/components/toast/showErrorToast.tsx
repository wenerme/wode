import { toast } from 'react-hot-toast';

export function showErrorToast(error: Error | any) {
  toast.error(getErrorMessage(error));
}

function getErrorMessage(error: Error | any) {
  if (typeof error === 'object' && 'message' in error) {
    return error.message;
  }
  return String(error);
}

export function showSuccessToast(msg: string) {
  toast.success(msg);
}
