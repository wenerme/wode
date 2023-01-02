import { toast } from 'react-hot-toast';

export function showErrorToast(error: Error | any) {
  toast.error(getErrorMessage(error));
}

function getErrorMessage(error: Error | any) {
  if ('message' in error) {
    return error.message;
  }
  return String(error);
}
