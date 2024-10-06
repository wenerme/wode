import { expect, test } from 'vitest';
import { getEmotions, parseEmotion } from './parseEmotion';

test('parseEmotion', () => {
  const s = '微笑[微笑][OK][微笑笑]哈哈[耶]好的[\nOK][OK]]';
  expect(parseEmotion(s)).toMatchObject([
    '微笑',
    {
      id: 0,
      cn: '微笑',
      // url: 'https://res.wx.qq.com/mpres/htmledition/images/icon/emotion/0.gif',
    },
    {
      id: 89,
      cn: 'OK',
      // url: 'https://res.wx.qq.com/mpres/htmledition/images/icon/emotion/89.gif',
    },
    '[微笑笑]哈哈',
    {
      id: 110,
      cn: '耶',
    },
    '好的[\nOK]',
    {
      id: 89,
      cn: 'OK',
      // url: 'https://res.wx.qq.com/mpres/htmledition/images/icon/emotion/89.gif',
    },
    ']',
  ]);
  expect(parseEmotion(s)).toMatchObject([
    '微笑',
    {
      cn: '微笑',
    },
    {
      cn: 'OK',
    },
    '[微笑笑]' + '哈哈',
    {
      cn: '耶',
    },
    '好的[\nOK]',
    {
      cn: 'OK',
    },
    ']',
  ]);
});

test('process', () => {
  // ⚠️ 113 之后来自 web QQ
  // 还有些缺少的
  getEmotions();

  // WebQQ
  // source https://pub.idqqimg.com/smartqq/js/mq.js
  const faceTextArr = [
    [
      '微笑',
      '撇嘴',
      '色',
      '发呆',
      '得意',
      '流泪',
      '害羞',
      '闭嘴',
      '睡',
      '大哭',
      '尴尬',
      '发怒',
      '调皮',
      '呲牙',
      '惊讶',
      '难过',
      '酷',
      '冷汗',
      '抓狂',
      '吐',
      '偷笑',
      '可爱',
      '白眼',
      '傲慢',
      '饥饿',
      '困',
      '惊恐',
      '流汗',
      '憨笑',
      '大兵',
      '奋斗',
      '咒骂',
      '疑问',
      '嘘',
      '晕',
      '折磨',
      '衰',
      '骷髅',
      '敲打',
      '再见',
      '擦汗',
      '抠鼻',
      '鼓掌',
      '糗大了',
      '坏笑',
      '左哼哼',
      '右哼哼',
      '哈欠',
      '鄙视',
      '委屈',
      '快哭了',
      '阴险',
      '亲亲',
      '吓',
      '可怜',
      '菜刀',
      '西瓜',
      '啤酒',
      '篮球',
      '乒乓',
      '咖啡',
      '饭',
      '猪头',
      '玫瑰',
      '凋谢',
      '示爱',
      '爱心',
      '心碎',
      '蛋糕',
      '闪电',
      '炸弹',
      '刀',
      '足球',
      '瓢虫',
      '便便',
      '月亮',
      '太阳',
      '礼物',
      '拥抱',
      '强',
      '弱',
      '握手',
      '胜利',
      '抱拳',
      '勾引',
      '拳头',
      '差劲',
      '爱你',
      'NO',
      'OK',
      '爱情',
      '飞吻',
      '跳跳',
      '发抖',
      '怄火',
      '转圈',
      '磕头',
      '回头',
      '跳绳',
      '挥手',
      '激动',
      '街舞',
      '献吻',
      '左太极',
      '右太极',
      '双喜',
      '鞭炮',
      '灯笼',
      '发财',
      'K歌',
      '购物',
      '邮件',
      '帅',
      '喝彩',
      '祈祷',
      '爆筋',
      '棒棒糖',
      '喝奶',
      '下面',
      '香蕉',
      '飞机',
      '开车',
      '左车头',
      '车厢',
      '右车头',
      '多云',
      '下雨',
      '钞票',
      '熊猫',
      '灯泡',
      '风车',
      '闹钟',
      '打伞',
      '彩球',
      '钻戒',
      '沙发',
      '纸巾',
      '药',
      '手枪',
      '青蛙',
    ],
    [
      'Smile',
      'Grimace',
      'Drool',
      'Scowl',
      'CoolGuy',
      'Sob',
      'Shy',
      'Silent',
      'Sleep',
      'Cry',
      'Awkward',
      'Angry',
      'Tongue',
      'Grin',
      'Surprise',
      'Frown',
      'Ruthless',
      'Blush',
      'Scream',
      'Puke',
      'Chuckle',
      'Joyful',
      'Slight',
      'Smug',
      'Hungry',
      'Drowsy',
      'Panic',
      'Sweat',
      'Laugh',
      'Commando',
      'Determined',
      'Scold',
      'Shocked',
      'Shhh',
      'Dizzy',
      'Tormented',
      'Toasted',
      'Skull',
      'Hammer',
      'Wave',
      'Speechless',
      'NosePick',
      'Clap',
      'Shame',
      'Trick',
      'Bah! L',
      'Bah! R',
      'Yawn',
      'Pooh-pooh',
      'Shrunken',
      'TearingUp',
      'Sly',
      'Kiss',
      'Wrath',
      'Whimper',
      'Cleaver',
      'Watermelon',
      'Beer',
      'Basketball',
      'PingPong',
      'Coffee',
      'Rice',
      'Pig',
      'Rose',
      'Wilt',
      'Lips',
      'Heart',
      'BrokenHeart',
      'Cake',
      'Lightning',
      'Bomb',
      'Dagger',
      'Soccer',
      'Ladybug',
      'Poop',
      'Moon',
      'Sun',
      'Gift',
      'Hug',
      'Strong',
      'Weak',
      'Shake',
      'Peace',
      'Fight',
      'Beckon',
      'Fist',
      'Pinky',
      'RockOn',
      'NO',
      'OK',
      'InLove',
      'Blowkiss',
      'Waddle',
      'Tremble',
      'Aaagh',
      'Twirl',
      'Kotow',
      'Dramatic',
      'JumpRope',
      'Surrender',
      'Exciting',
      'HipHot',
      'ShowLove',
      'Tai Chi L',
      'Tai Chi R',
      'Congratulations',
      'Firecracker',
      'Lantern',
      'Richer',
      'Karaoke',
      'Shopping',
      'Email',
      'Handsome',
      'Cheers',
      'Pray',
      'BlowUp',
      'Lolly',
      'Milk',
      'Noodles',
      'Banana',
      'Plane',
      'Car',
      'Locomotive',
      'Train',
      'Train Tail',
      'Cloudy',
      'Rain',
      'Dollor',
      'Panda',
      'Bulb',
      'Windmill',
      'Clock',
      'Umbrella',
      'Balloon',
      'Ring',
      'Sofa',
      'toiletPaper',
      'Pill',
      'Pistol',
      'Frog',
    ],
  ];

  let old = getEmotions();
  for (let id = 0; id < faceTextArr[0].length; id++) {
    let cn = faceTextArr[0][id];
    let en = faceTextArr[1][id];

    if (!old[id]) {
      console.log(`not found ${id} ${cn} ${en}`);
      old[id] = { id, cn, en };
      continue;
    }
    /*
0 为惊讶 QQ 同 微信顺序
http://pub.idqqimg.com/lib/qqface/0.gif
0 为微笑 WebQQ
https://res.wx.qq.com/mpres/htmledition/images/icon/emotion/0.gif

QQ Bot 文档列举了一些其他的表情
https://bot.q.qq.com/wiki/develop/api/openapi/emoji/model.html

参考
微信 Emoji 素材
https://github.com/airinghost/wechat-emoji
映射
https://github.com/qiuyinghua/wechat-emoticons
https://github.com/mingtianyihou33/wechat-emoji-parser

WebQQ Regex
/\[([A-Z\u4e00-\u9fa5]{1,20}?)\]/gi

存在不一致的映射
Mismatch 21 愉快 -> 可爱 Joyful
Mismatch 105 嘿哈 -> 双喜 Congratulations
Mismatch 106 捂脸 -> 鞭炮 Firecracker
Mismatch 107 奸笑 -> 灯笼 Lantern
Mismatch 108 机智 -> 发财 Richer
Mismatch 109 皱眉 -> K歌 Karaoke
Mismatch 110 耶 -> 购物 Shopping
Mismatch 111 红包 -> 邮件 Email
Mismatch 112 鸡 -> 帅 Handsome

var CDN_FACE = 'http://pub.idqqimg.com/lib/qqface/';
var GET_OFFPIC_URL = 'https://w.qq.com/d/channel/get_offpic2';

// 表情文本最大值

  var FACE_TEXT_MAX_NUM = 20;
  //表情映射表
  var FACE_MAP = [
      14,1,2,3,4,5,6,7,8,9,10,11,12,13,
      0,15,16,96,18,19,20,21,22,23,24,25,26,27,
      28,29,30,31,32,33,34,35,36,37,38,39,97,98,
      99,100,101,102,103,104,105,106,107,108,109,110,111,112,
      89,113,114,115,60,61,46,63,64,116,66,67,53,54,
      55,56,57,117,59,75,74,69,49,76,77,78,79,118,
      119,120,121,122,123,124,42,85,43,41,86,125,126,127,
      128,129,130,131,132,133,134,136,137,138,139,140,141,142,
      143,144,145,146,147,148,149,150,151,152,153,154,155,156,
      157,158,159,160,161,162,163,164,165,166,167,168,169,170
  ];
  var FACE_WEBQQ_MAP = [
      14,1,2,3,4,5,6,7,8,9,10,11,12,13,
      0,50,51,96,53,54,73,74,75,76,77,78,55,56,
      57,58,79,80,81,82,83,84,85,86,87,88,97,98,
      99,100,101,102,103,104,105,106,107,108,109,110,111,112,
      32,113,114,115,63,64,59,33,34,116,36,37,38,91,
      92,93,29,117,72,45,42,39,62,46,47,71,95,118,
      119,120,121,122,123,124,27,21,23,25,26,125,126,127,
      128,129,130,131,132,133,134,136,137,138,139,140,141,142,
      143,144,145,146,147,148,149,150,151,152,153,154,155,156,
      157,158,159,160,161,162,163,164,165,166,167,168,169,170

  ];
  //发送表情,由FACE_WEBQQ_MAP转换ID
  var FACE_TEXT_MAP = {
      "微笑": 14,"撇嘴":1,"色":2,"发呆":3,"得意":4,"流泪":5,"害羞":6,"闭嘴":7,"睡":8,"大哭":9,"尴尬":10,"发怒":11,"调皮":12,"呲牙":13,
      "惊讶":0,"难过":50,"酷":51,"冷汗":96,"抓狂":53,"吐":54,"偷笑":73,"可爱":74,"白眼":75,"傲慢":76,"饥饿":77,"困":78,"惊恐":55,"流汗":56,
      "憨笑":57 ,"大兵":58 ,"奋斗":79 ,"咒骂":80 ,"疑问":81 ,"嘘":82  ,"晕":83  ,"折磨":84 ,"衰":85  ,"骷髅":86 ,"敲打":87 ,"再见":88,"擦汗":97 ,"抠鼻":98,
      "鼓掌":99 ,"糗大了":100 ,"坏笑":101 ,"左哼哼":102 ,"右哼哼":103 ,"哈欠":104 ,"鄙视":105 ,"委屈":106 ,"快哭了":107 ,"阴险":108 ,"亲亲":109 ,"吓":110  ,"可怜":111  ,"菜刀":112,
      "西瓜":32 ,"啤酒":113  ,"篮球":114  ,"乒乓":115  ,"咖啡":63 ,"饭":64 ,"猪头":59 ,"玫瑰":33 ,"凋谢":34 ,"示爱":116 ,"爱心":36 ,"心碎":37 ,"蛋糕":38 ,"闪电":91 ,
      "炸弹":92 ,"刀":93,"足球":29 ,"瓢虫":117 ,"便便":72 ,"月亮":45 ,"太阳":42 ,"礼物":39 ,"拥抱":62 ,"强":46 ,"弱":47 ,"握手":71 ,"胜利":95 ,"抱拳":118 ,
      "勾引":119 ,"拳头":120 ,"差劲":121 ,"爱你":122 ,"NO":123 ,"OK":124 ,"爱情":27 ,"飞吻":21 ,"跳跳":23 ,"发抖":25 ,"怄火":26 ,"转圈":125 ,"磕头":126 ,"回头":127 ,
      "跳绳":128 ,"挥手":129 ,"激动":130 ,"街舞":131 ,"献吻":132 ,"左太极":133 ,"右太极":134,"双喜":136,"鞭炮":137,"灯笼":138,"发财":139,"K歌":140,"购物":141,"邮件":142,
      "帅":143,"喝彩":144,"祈祷":145,"爆筋":146,"棒棒糖":147,"喝奶":148,"下面":149,"香蕉":150,"飞机":151,"开车":152,"左车头":153,"车厢":154,"右车头":155,"多云":156,
      "下雨":157,"钞票":158,"熊猫":159,"灯泡":160,"风车":161,"闹钟":162,"打伞":163,"彩球":164,"钻戒":165,"沙发":166,"纸巾":167,"药":168,"手枪":169,"青蛙":170

  };
     */
    if (old[id].cn !== cn) {
      console.log(`Mismatch ${id} ${old[id].cn} -> ${cn} ${en}`);
      // const v = old[id];
      // v.alias ||= [];
      // v.alias.push(v.cn);
      // v.cn = cn;
    } else {
      old[id].en = en;
    }
  }

  console.log(JSON.stringify(old, null, 2));
});
