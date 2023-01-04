import React from 'react';
import { ExternalLink } from '../../common/ExternalLink';
import { FootNote } from '../../common/FootNote';

export const ZxcvbnNote = () => {
  return (
    <FootNote>
      <ExternalLink href="https://en.wikipedia.org/wiki/Password_strength">密码强度</ExternalLink>
      算法使用
      <ExternalLink href="https://blogs.dropbox.com/tech/2012/04/zxcvbn-realistic-password-strength-estimation/">
        zxcvbn
      </ExternalLink>{' '}
      。
    </FootNote>
  );
};
