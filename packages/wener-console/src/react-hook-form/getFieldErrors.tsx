import type { FieldError, FieldErrors } from 'react-hook-form';

export function getFieldErrors(err: FieldErrors): Array<{
  path: string;
  error: FieldError;
}> {
  const out: Array<{
    path: string;
    error: FieldError;
  }> = [];
  const collect = (err: any, pre: string) => {
    for (const [key, val] of Object.entries(err)) {
      if (val && typeof val === 'object' && 'type' in val && typeof val.type === 'string') {
        out.push({ path: pre + key, error: val as FieldError });
      } else {
        collect(val, pre + key + '.');
      }
    }
  };
  collect(err, '');
  return out;
}
