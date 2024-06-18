import { Meta } from '@storybook/react';
import pinyin from 'pinyin';

const meta: Meta = {
  title: 'web/Hello',
};
export default meta;


export const Demo = () => {
  return <div>Hello</div>;
};

const riddles = [
  {
    'riddle': '天上飞，不是鸟，前边翅膀大，后边翅膀小，喝饱汽油飞得高。',
    'hint': '打一交通工具',
    'answer': '飞机',
  },
  {
    'riddle': '钢铁身子重万斤，搁在水里它不沉。不怕风浪大，就怕水不深。',
    'hint': '打一交通工具',
    'answer': '轮船或军舰',
  },
  {
    'riddle': '长长一条龙，走路轰隆隆，遇水过铁桥，遇山钻山洞，脚下钢轮力气大，日行千里真威风。',
    'hint': '打一交通工具',
    'answer': '火车',
  },
  {
    'riddle': '四脚圆滚滚，眼睛亮晶晶，嘀嘀叫一声，招手过路人。',
    'hint': '打一交通工具',
    'answer': '汽车',
  },
  {
    'riddle': '有时候，圆又圆，有时候，弯又弯，有时晚上出来了，有时晚上看不见。',
    'hint': '打一自然现象',
    'answer': '月亮',
  },
  {
    'riddle': '说是牛，不是牛，不吃草，光喝油，工人叔叔送它来，支援农业大丰收。',
    'hint': '打一机具',
    'answer': '拖拉机',
  },
  {
    'riddle': '十个客人十间屋，冷了进去暖了出。',
    'hint': '打一物',
    'answer': '手套',
  },
  {
    'riddle': '小小两只船，没桨又没帆，白天带它到处走，黑夜停在床跟前。',
    'hint': '打一物',
    'answer': '鞋',
  },
  {
    'riddle': '一本书，天天看，看了一篇撕一篇。一年到头多少天，小书撕下多少篇。',
    'hint': '打一物',
    'answer': '日历',
  },
  {
    'riddle': '你说稀奇不稀奇，汽车长着长胳膊，抓起东西往上举，千斤万斤不费力。',
    'hint': '打一机具',
    'answer': '起重机',
  },
];


export const RiddleCard = () => {

  return <div className={'w-[210mm]'}>
    <div className={'text-4xl leading-loose flex flex-col gap-4'}>

      {
        riddles.map((v, idx) => {
            let py = pinyin(v.riddle);
            let py2 = pinyin(v.answer);
            return <div key={idx}>
              <div>
                {v.riddle.split('').map((c, i) => {
                  return <ruby>
                    {c}
                    <rp>(</rp>
                    <rt>{py[i]}</rt>
                    <rp>)</rp>
                  </ruby>;
                })}
              </div>
              <div className={'rotate-180'}>
                {
                  v.answer.split('').map((c, i) => {
                    return <ruby>
                      {c}
                      <rp>(</rp>
                      <rt>{py2[0]}</rt>
                      <rp>)</rp>
                    </ruby>;
                  })
                }
              </div>
            </div>;
          },
        )
      }
    </div>
  </div>;
};

export const GomokuBoardDemo = () => {
  return <div className={'w-[210mm] bg-white flex items-center justify-center p-4'}>
    <GomokuBoard />
  </div>;
};


const GomokuBoard = () => {
  const rows = Array.from({ length: 15 });
  const cols = Array.from({ length: 15 });

  return (
    <div className='bg-white border-r border-b border-gray-400 flex flex-col'>
      {rows.map((_, rowIndex) => (
        <div key={rowIndex} className='flex'>
          {cols.map((_, colIndex) => (
            <div
              key={colIndex}
              className='w-10 h-10 border-l border-t border-gray-400 flex justify-center items-center'
            >
              {/* 棋子占位符 */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
