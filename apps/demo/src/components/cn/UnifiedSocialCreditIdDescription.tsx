import { DivisionFormat, ValidFormat } from './Formats';
import { UnifiedSocialCreditId } from './gb31200/UnifiedSocialCreditId';
import { mod31 } from './gb31200/mod31';

export const UnifiedSocialCreditIdDescription: React.FC<{ item: UnifiedSocialCreditId }> = ({ item }) => {
  const { sum, subject, primary, division, bureau, subtype, bureauLabel, bureauSubtypeLabel } = item;
  return (
    <dl className='grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2'>
      <div className='sm:col-span-2'>
        <dt className='text-sm font-medium opacity-85'>{UnifiedSocialCreditId.Descriptor.title}</dt>
        <dd className='mt-1 text-sm'>{item.toString()}</dd>
      </div>
      <div className='sm:col-span-1'>
        <dt className='text-sm font-medium opacity-85'>登记管理部门</dt>
        <dd className='mt-1 text-sm'>
          {bureauLabel} <small>{bureau}</small>
        </dd>
      </div>
      <div className='sm:col-span-1'>
        <dt className='text-sm font-medium opacity-85'>机构类别</dt>
        <dd className='mt-1 text-sm'>
          {bureauSubtypeLabel} <small>{subtype}</small>
        </dd>
      </div>
      <div className='sm:col-span-2'>
        <dt className='text-sm font-medium opacity-85'>登记管理机关行政区划码</dt>
        <dd className='mt-1 text-sm'>
          <DivisionFormat value={division} />
        </dd>
      </div>
      <div className='sm:col-span-1'>
        <dt className='text-sm font-medium opacity-85'>主体标识码/组织机构代码</dt>
        <dd className='mt-1 text-sm'>{subject}</dd>
      </div>
      <div className='sm:col-span-1'>
        <dt className='text-sm font-medium opacity-85'>校验码</dt>
        <dd className='mt-1 text-sm'>
          <ValidFormat actual={sum} expected={mod31(primary)} />
        </dd>
      </div>
    </dl>
  );
};
