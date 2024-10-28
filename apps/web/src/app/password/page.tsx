import { redirect } from 'next/navigation';

export default function () {
  redirect('/password/strength');

  return null;
}
