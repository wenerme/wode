import React from 'react';
import { FootNote } from '@/components/FootNote';
import { FootNoteLink } from '@/components/FootNoteLink';

export const ZxcvbnNote = () => {
  return (
    <FootNote>
      <FootNoteLink href='https://en.wikipedia.org/wiki/Password_strength'>密码强度</FootNoteLink>
      算法使用
      <FootNoteLink href='https://blogs.dropbox.com/tech/2012/04/zxcvbn-realistic-password-strength-estimation/'>
        zxcvbn
      </FootNoteLink>{' '}
      。
    </FootNote>
  );
};
