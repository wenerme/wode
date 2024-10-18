import pinyin from 'pinyin';
import { PageContainer } from '@/components/page/PageContainer';
import { getChildrenRiddles } from '@/data/const';

export const RiddlePrintPage = () => {
  return (
    <PageContainer className={'flex flex-col items-center'}>
      <h3 className={'py-4 text-2xl font-semibold'}>猜谜语</h3>
      <RiddleCard />
    </PageContainer>
  );
};

export const RiddleCard = () => {
  return (
    <div className={'w-[210mm]'}>
      <div className={'flex flex-col gap-4 text-4xl leading-loose'}>
        {getChildrenRiddles().map((v, idx) => {
          let py = pinyin(v.riddle);
          let py2 = pinyin(v.answer);
          return (
            <div key={idx} className={'border-b py-2'}>
              <div>
                {v.riddle.split('').map((c, i) => {
                  return (
                    <ruby key={i}>
                      {c}
                      <rp>(</rp>
                      <rt>{py[i]}</rt>
                      <rp>)</rp>
                    </ruby>
                  );
                })}
              </div>
              <div className={'rotate-180'}>
                {v.answer.split('').map((c, i) => {
                  return (
                    <ruby key={i}>
                      {c}
                      <rp>(</rp>
                      <rt>{py2[i]}</rt>
                      <rp>)</rp>
                    </ruby>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GomokuBoard = () => {
  const rows = Array.from({ length: 15 });
  const cols = Array.from({ length: 15 });

  return (
    <div className='flex flex-col border-b border-r border-gray-400 bg-white'>
      {rows.map((_, rowIndex) => (
        <div key={rowIndex} className='flex'>
          {cols.map((_, colIndex) => (
            <div
              key={colIndex}
              className='flex h-10 w-10 items-center justify-center border-l border-t border-gray-400'
            >
              {/* 棋子占位符 */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
