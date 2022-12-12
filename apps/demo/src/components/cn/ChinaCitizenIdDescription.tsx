import { DivisionFormat, GenderFormat, ValidFormat } from './Formats';
import { ChinaCitizenId } from './gb11643/ChinaCitizenId';
import { mod11 } from './gb11643/mod11';

export const ChinaCitizenIdDescription: React.FC<{ item: ChinaCitizenId }> = ({ item }) => {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="text-sm font-medium opacity-85">{'身份证'}</dt>
        <dd className="mt-1 text-sm">{item.toString()}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-sm font-medium opacity-85">出生地</dt>
        <dd className="mt-1 text-sm">
          <DivisionFormat value={item.division} />
        </dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">性别</dt>
        <dd className="mt-1 text-sm">
          <GenderFormat value={item.gender} />
        </dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">出生日期</dt>
        <dd className="mt-1 text-sm">{item.date.format('YYYY-MM-DD')}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">序号</dt>
        <dd className="mt-1 text-sm">{item.sequence}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">校验码</dt>
        <dd className="mt-1 text-sm">
          <ValidFormat actual={item.sum} expected={mod11(item.primary)} />
        </dd>
      </div>
    </dl>
  );
};
