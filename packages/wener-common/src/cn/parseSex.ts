export function parseSex(s: string):
  | undefined
  | {
      sex: 'Male' | 'Female';
      male: boolean;
      female: boolean;
    } {
  if (!s) return undefined;

  switch (s.toLowerCase()) {
    case '男':
    case 'male':
      return {
        sex: 'Male',
        male: true,
        female: false,
      };
    case '女':
    case 'female':
      return {
        sex: 'Female',
        male: false,
        female: true,
      };
  }
  return undefined;
}
