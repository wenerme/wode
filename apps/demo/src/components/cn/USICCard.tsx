import { IdTypes } from './code';
import type { ParsedUSCI } from './usci/usci';
import { USICRegistryBureauCode } from './usci/usci';

export const USICCard: React.FC<{ item: ParsedUSCI }> = ({ item }) => {
  return (
    <>
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="card-title">
            <h3 className="text-lg font-medium leading-6">{IdTypes.USCI.label}</h3>
            <p className="mt-1 max-w-2xl text-sm opacity-75">{IdTypes.USCI.fullName}</p>
          </div>

          <div className="border-t border-base-300 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium opacity-85">{IdTypes.USCI.label}</dt>
                <dd className="mt-1 text-sm">{item.raw}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium opacity-85">登记管理部门</dt>
                <dd className="mt-1 text-sm">{USICRegistryBureauCode[item.registryBureauCode]?.label}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium opacity-85">机构类别</dt>
                <dd className="mt-1 text-sm">
                  {USICRegistryBureauCode[item.registryBureauCode]?.codes?.[item.registryBureauTypeCode]?.label}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium opacity-85">登记管理机关行政区划码</dt>
                <dd className="mt-1 text-sm">{item.registryBureauDistrictCode}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium opacity-85">主体标识码/组织机构代码</dt>
                <dd className="mt-1 text-sm">{item.subjectCode}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium opacity-85">校验码</dt>
                <dd className="mt-1 text-sm">{item.checkCode}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};
