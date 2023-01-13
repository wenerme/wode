import React from 'react';
import { HiCog } from 'react-icons/hi2';
import { Form, Link } from 'react-router-dom';
import { Button } from 'common/src/daisy';
import { IpfsOutlined } from 'common/src/icons';
import { SearchPageLayout } from 'common/src/system/layouts';
import { buildIpfsLink } from './buildIpfsLink';

export const IpfsAccess = () => {
  return (
    <Form method={'get'} action={'/ipfs'}>
      <SearchPageLayout
        icon={IpfsOutlined}
        action={
          <div>
            <Button ghost circle as={Link} to={'setting/gateway'}>
              <HiCog className={'w-8 h-8'} />
            </Button>
          </div>
        }
        name={'hash'}
        title={'IPFS Access'}
        placeholder={'Search IPFS Hash'}
      >
        {({ value }) => <HashResult hash={value} />}
      </SearchPageLayout>
    </Form>
  );
};

const HashResult: React.FC<{ hash: string }> = ({ hash }) => {
  const link = buildIpfsLink({ hash });
  return (
    <div>
      <div>
        <small>
          <a href={link} target={'_blank'} rel="noreferrer" className={'hover:text-info'}>
            {link}
          </a>
        </small>
      </div>
    </div>
  );
};

export default IpfsAccess;
