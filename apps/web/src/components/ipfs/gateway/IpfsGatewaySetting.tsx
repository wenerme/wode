import React from 'react';
import { AiFillApi, AiOutlineDownload } from 'react-icons/ai';
import { Button } from '@wener/console/daisy';
import { SettingLayout } from '@wener/console/web';
import { useSnapshot } from 'valtio';
import { buildIpfsLink } from '../buildIpfsLink';
import { getRecommendGateways, useIpfsGatewayState } from '../gateway';
import { getGatewayCheckTextHash } from './checker';

export const IpfsGatewaySetting = () => {
  const ipfsGatewayState = useIpfsGatewayState();
  const { prefer } = useSnapshot(ipfsGatewayState);
  return (
    <SettingLayout title={'IPFS 设置'}>
      <div className='form-control'>
        <label className='label'>
          <span className='label-text'>下载网关</span>
        </label>
        <label className='input-group input-group-sm'>
          <span>
            <AiFillApi />
          </span>
          <input
            type='text'
            placeholder='https://ipfs.io/ipfs/:hash'
            value={prefer}
            className='input input-sm input-bordered flex-1'
            onChange={(e) => {
              ipfsGatewayState.prefer = e.target.value;
            }}
          />
          <Button
            size={'sm'}
            target={'_blank'}
            href={buildIpfsLink({ gateway: prefer, hash: getGatewayCheckTextHash() })}
            download={'ipfs-hello.txt'}
          >
            <AiOutlineDownload />
            下载测试文件
          </Button>
        </label>
      </div>
      <div className={'p-2'}>
        <h6 className={'text-xs'}>推荐网关</h6>
        <div className={'flex flex-wrap gap-2'}>
          {getRecommendGateways().map((v) => {
            return (
              <Button size={'xs'} key={v} className={'normal-case'} ghost onClick={() => (ipfsGatewayState.prefer = v)}>
                {v}
              </Button>
            );
          })}
        </div>
      </div>
    </SettingLayout>
  );
};

export default IpfsGatewaySetting;
