import React from 'react';
import { useImmer } from 'use-immer';

const nameColors = [
  { name: 'aliceblue', hex: '#F0F8FF', zh: '爱丽丝蓝' },
  { name: 'antiquewhite', hex: '#FAEBD7', zh: '仿古白色' },
  { name: 'aqua', hex: '#00FFFF', zh: '水色' },
  { name: 'aquamarine', hex: '#7FFFD4', zh: '碧绿色' },
  { name: 'azure', hex: '#F0FFFF', zh: 'azure' },
  { name: 'beige', hex: '#F5F5DC', zh: '浅褐色' },
  { name: 'bisque', hex: '#FFE4C4', zh: '浅棕色' },
  { name: 'black', hex: '#000000', zh: '黑色' },
  { name: 'blanchedalmond', hex: '#FFEBCD' },
  { name: 'blue', hex: '#0000FF', zh: '蓝色' },
  { name: 'blueviolet', hex: '#8A2BE2', zh: '紫罗兰色' },
  { name: 'brown', hex: '#A52A2A', zh: '棕色' },
  { name: 'burlywood', hex: '#DEB887', zh: '' },
  { name: 'cadetblue', hex: '#5F9EA0', zh: '学员蓝' },
  { name: 'chartreuse', hex: '#7FFF00', zh: '黄绿色' },
  { name: 'chocolate', hex: '#D2691E', zh: '巧克力色' },
  { name: 'coral', hex: '#FF7F50', zh: '珊瑚色' },
  { name: 'cornflowerblue', hex: '#6495ED', zh: '矢车菊蓝色' },
  { name: 'cornsilk', hex: '#FFF8DC', zh: '玉米丝' },
  { name: 'crimson', hex: '#DC143C', zh: '赤红' },
  { name: 'cyan', hex: '#00FFFF', zh: '青色' },
  { name: 'darkblue', hex: '#00008B', zh: '深蓝/碧蓝' },
  { name: 'darkcyan', hex: '#008B8B', zh: '深青色' },
  { name: 'darkgoldenrod', hex: '#B8860B', zh: '' },
  { name: 'darkgray', hex: '#A9A9A9', zh: '深灰色' },
  { name: 'darkgreen', hex: '#006400', zh: '深绿色' },
  { name: 'darkgrey', hex: '#A9A9A9', zh: '深灰色' },
  { name: 'darkkhaki', hex: '#BDB76B', zh: '黑卡其色' },
  { name: 'darkmagenta', hex: '#8B008B', zh: '深洋红色' },
  { name: 'darkolivegreen', hex: '#556B2F', zh: '黑橄榄绿' },
  { name: 'darkorange', hex: '#FF8C00', zh: '暗橙' },
  { name: 'darkorchid', hex: '#9932CC', zh: '黑兰花' },
  { name: 'darkred', hex: '#8B0000', zh: '深红/绯红' },
  { name: 'darksalmon', hex: '#E9967A', zh: '黑鲑鱼' },
  { name: 'darkseagreen', hex: '#8FBC8F', zh: '深海绿' },
  { name: 'darkslateblue', hex: '#483D8B', zh: '深石板蓝' },
  { name: 'darkslategray', hex: '#2F4F4F', zh: '暗板灰色' },
  { name: 'darkslategrey', hex: '#2F4F4F', zh: '暗板灰色' },
  { name: 'darkturquoise', hex: '#00CED1', zh: '深绿松石色' },
  { name: 'darkviolet', hex: '#9400D3', zh: '深紫色' },
  { name: 'deeppink', hex: '#FF1493', zh: '深粉红色' },
  { name: 'deepskyblue', hex: '#00BFFF', zh: '深天蓝' },
  { name: 'dimgray', hex: '#696969', zh: '暗灰色' },
  { name: 'dimgrey', hex: '#696969', zh: '暗灰色' },
  { name: 'dodgerblue', hex: '#1E90FF', zh: '道奇蓝' },
  { name: 'firebrick', hex: '#B22222', zh: '' },
  { name: 'floralwhite', hex: '#FFFAF0', zh: '花白色' },
  { name: 'forestgreen', hex: '#228B22', zh: '森林绿' },
  { name: 'fuchsia', hex: '#FF00FF', zh: '紫红色' },
  { name: 'gainsboro', hex: '#DCDCDC', zh: '' },
  { name: 'ghostwhite', hex: '#F8F8FF', zh: '鬼白' },
  { name: 'gold', hex: '#FFD700', zh: '金色' },
  { name: 'goldenrod', hex: '#DAA520', zh: '' },
  { name: 'gray', hex: '#808080', zh: '灰色' },
  { name: 'green', hex: '#008000', zh: '绿色' },
  { name: 'greenyellow', hex: '#ADFF2F', zh: '黄绿色' },
  { name: 'grey', hex: '#808080', zh: '灰色' },
  { name: 'honeydew', hex: '#F0FFF0', zh: '甘露' },
  { name: 'hotpink', hex: '#FF69B4', zh: '亮粉色' },
  { name: 'indianred', hex: '#CD5C5C', zh: '印度红' },
  { name: 'indigo', hex: '#4B0082', zh: '靛青' },
  { name: 'ivory', hex: '#FFFFF0', zh: '象牙' },
  { name: 'khaki', hex: '#F0E68C', zh: '卡其色' },
  { name: 'lavender', hex: '#E6E6FA', zh: '薰衣草' },
  { name: 'lavenderblush', hex: '#FFF0F5', zh: '薰衣草腮红' },
  { name: 'lawngreen', hex: '#7CFC00', zh: '草坪绿' },
  { name: 'lemonchiffon', hex: '#FFFACD', zh: '柠檬雪纺' },
  { name: 'lightblue', hex: '#ADD8E6', zh: '浅蓝' },
  { name: 'lightcoral', hex: '#F08080', zh: '浅珊瑚' },
  { name: 'lightcyan', hex: '#E0FFFF', zh: '浅青色' },
  { name: 'lightgoldenrodyellow', hex: '#FAFAD2', zh: '' },
  { name: 'lightgray', hex: '#D3D3D3', zh: '浅灰' },
  { name: 'lightgreen', hex: '#90EE90', zh: '浅绿色/品绿/葱绿' },
  { name: 'lightgrey', hex: '#D3D3D3', zh: '浅灰' },
  { name: 'lightpink', hex: '#FFB6C1', zh: '浅粉色' },
  { name: 'lightsalmon', hex: '#FFA07A', zh: '' },
  { name: 'lightseagreen', hex: '#20B2AA', zh: '浅海绿' },
  { name: 'lightskyblue', hex: '#87CEFA', zh: '浅天蓝色' },
  { name: 'lightslategray', hex: '#778899', zh: '灯石灰色' },
  { name: 'lightslategrey', hex: '#778899', zh: '灯石灰色' },
  { name: 'lightsteelblue', hex: '#B0C4DE', zh: '轻钢蓝色' },
  { name: 'lightyellow', hex: '#FFFFE0', zh: '淡黄色/葱黄' },
  { name: 'lime', hex: '#00FF00', zh: '酸橙' },
  { name: 'limegreen', hex: '#32CD32', zh: '青柠' },
  { name: 'linen', hex: '#FAF0E6', zh: '亚麻布' },
  { name: 'magenta', hex: '#FF00FF', zh: '品红' },
  { name: 'maroon', hex: '#800000', zh: '栗色' },
  { name: 'mediumaquamarine', hex: '#66CDAA', zh: '中等海蓝宝石' },
  { name: 'mediumblue', hex: '#0000CD', zh: '' },
  { name: 'mediumorchid', hex: '#BA55D3', zh: '' },
  { name: 'mediumpurple', hex: '#9370DB', zh: '' },
  { name: 'mediumseagreen', hex: '#3CB371', zh: '' },
  { name: 'mediumslateblue', hex: '#7B68EE', zh: '' },
  { name: 'mediumspringgreen', hex: '#00FA9A', zh: '' },
  { name: 'mediumturquoise', hex: '#48D1CC', zh: '' },
  { name: 'mediumvioletred', hex: '#C71585', zh: '' },
  { name: 'midnightblue', hex: '#191970', zh: '午夜蓝' },
  { name: 'mintcream', hex: '#F5FFFA', zh: '薄荷糖' },
  { name: 'mistyrose', hex: '#FFE4E1', zh: '' },
  { name: 'moccasin', hex: '#FFE4B5', zh: '' },
  { name: 'navajowhite', hex: '#FFDEAD', zh: '' },
  { name: 'navy', hex: '#000080', zh: '海军蓝/深蓝色' },
  { name: 'oldlace', hex: '#FDF5E6', zh: '' },
  { name: 'olive', hex: '#808000', zh: '橄榄/黄褐色/黄绿色' },
  { name: 'olivedrab', hex: '#6B8E23', zh: '橄榄色' },
  { name: 'orange', hex: '#FFA500', zh: '橙' },
  { name: 'orangered', hex: '#FF4500', zh: '橙红色' },
  { name: 'orchid', hex: '#DA70D6', zh: '兰花' },
  { name: 'palegoldenrod', hex: '#EEE8AA', zh: '' },
  { name: 'palegreen', hex: '#98FB98', zh: '淡绿色' },
  { name: 'paleturquoise', hex: '#AFEEEE', zh: '绿松石色' },
  { name: 'palevioletred', hex: '#DB7093', zh: '淡紫色' },
  { name: 'papayawhip', hex: '#FFEFD5', zh: '木瓜鞭' },
  { name: 'peachpuff', hex: '#FFDAB9', zh: '桃子泡芙' },
  { name: 'peru', hex: '#CD853F', zh: '' },
  { name: 'pink', hex: '#FFC0CB', zh: '粉红/桃红' },
  { name: 'plum', hex: '#DDA0DD', zh: '梅色' },
  { name: 'powderblue', hex: '#B0E0E6', zh: '粉蓝色' },
  { name: 'purple', hex: '#800080', zh: '紫色' },
  { name: 'rebeccapurple', hex: '#663399', zh: '' },
  { name: 'red', hex: '#FF0000', zh: '红色' },
  { name: 'rosybrown', hex: '#BC8F8F', zh: '红褐色' },
  { name: 'royalblue', hex: '#4169E1', zh: '宝蓝色' },
  { name: 'saddlebrown', hex: '#8B4513', zh: '马鞍棕色' },
  { name: 'salmon', hex: '#FA8072', zh: '三文鱼' },
  { name: 'sandybrown', hex: '#F4A460', zh: '沙褐色' },
  { name: 'seagreen', hex: '#2E8B57', zh: '海绿色' },
  { name: 'seashell', hex: '#FFF5EE', zh: '贝壳' },
  { name: 'sienna', hex: '#A0522D', zh: '赭色' },
  { name: 'silver', hex: '#C0C0C0', zh: '银' },
  { name: 'skyblue', hex: '#87CEEB', zh: '天蓝色' },
  { name: 'slateblue', hex: '#6A5ACD', zh: '板岩蓝' },
  { name: 'slategray', hex: '#708090', zh: '石板灰' },
  { name: 'slategrey', hex: '#708090', zh: '石板灰' },
  { name: 'snow', hex: '#FFFAFA', zh: '雪白' },
  { name: 'springgreen', hex: '#00FF7F', zh: '春绿' },
  { name: 'steelblue', hex: '#4682B4', zh: '钢蓝色' },
  { name: 'tan', hex: '#D2B48C', zh: '棕褐色' },
  { name: 'teal', hex: '#008080', zh: '青色' },
  { name: 'thistle', hex: '#D8BFD8', zh: '' },
  { name: 'tomato', hex: '#FF6347', zh: '番茄' },
  { name: 'turquoise', hex: '#40E0D0', zh: '绿松石' },
  { name: 'violet', hex: '#EE82EE', zh: '紫罗兰色/绀' },
  { name: 'wheat', hex: '#F5DEB3', zh: '小麦' },
  { name: 'white', hex: '#FFFFFF', zh: '白色' },
  { name: 'whitesmoke', hex: '#F5F5F5', zh: '' },
  { name: 'yellow', hex: '#FFFF00', zh: '黄色' },
  { name: 'yellowgreen', hex: '#9ACD32', zh: '黄绿色' },
];
const systemColors = [
  { name: 'Canvas' },
  { name: 'CanvasText' },
  { name: 'LinkText' },
  { name: 'VisitedText' },
  { name: 'ActiveText' },
  { name: 'ButtonFace' },
  { name: 'ButtonText' },
  { name: 'ButtonBorder' },
  { name: 'Field' },
  { name: 'FieldText' },
  { name: 'Highlight' },
  { name: 'HighlightText' },
  { name: 'SelectedItem' },
  { name: 'SelectedItemText' },
  { name: 'Mark' },
  { name: 'MarkText' },
  { name: 'GrayText' },
];

export const ColorNameContent = () => {
  const [colorSet, setColorSet] = useImmer(() => ({
    named: nameColors,
    system: systemColors,
  }));
  const [settings, updateSettings] = useImmer<{ display: 'named' | 'system' }>({ display: 'named' });

  const colors: Array<{ name: string; hex?: string; zh?: string }> = colorSet[settings.display];
  return (
    <div className={'flex justify-center flex flex-col'}>
      <div className={'p-2'}>
        <select
          className={'select select-sm select-bordered'}
          value={settings.display}
          onChange={(e) => updateSettings({ ...settings, display: e.currentTarget.value as any })}
        >
          <option value='named'>Named Color</option>
          <option value='system'>System Color</option>
        </select>
      </div>
      <table className={'table w-full table-compact'}>
        <colgroup>
          <col width={120} />
          <col width={140} />
          <col width={120} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>中文</th>
            <th>Hex</th>
          </tr>
        </thead>
        <tbody>
          {colors.map(({ name, hex, zh }) => (
            <tr key={hex}>
              <td>
                <div className={'border w-[80px] h-[20px]'} style={{ backgroundColor: name }}></div>
              </td>
              <td>{name}</td>
              <td>{zh}</td>
              <td>{hex}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
