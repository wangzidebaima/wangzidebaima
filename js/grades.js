// 年级 → 各科数据源的映射表。
// 【加新年级只改这张表】业务代码里不许再出现按年级的 if 判断——以前那些
// 「不是二年级就给四年级词语」「不是七年级就给四年级单词」的写法，会让新年级
// 的孩子拿到别的年级的课本内容，而且页面完全正常，谁都发现不了。
const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

export const GRADES = {
  g2: {
    name: '二年级', cnw: 'cnw2', words: '', speak: '',
    papers: null,
  },
  g4: {
    name: '四年级', cnw: 'cnw4', words: '4', speak: 'g4speaking',
    papers: { math: 5, eng: 6 },
    engUnit: (i) => 'u' + i,           // 英语卷子第 i 单元的题集号
  },
  g7: {
    name: '七年级', cnw: 'cnw4', words: '7', speak: 'g7speaking',
    papers: { math: 5, eng: 10 },      // 目前卷子只有四、七年级
    // 七年级英语课本前三个单元叫 Starter（s1/s2/s3），后面才用 u 打头
    engUnit: (i) => (i <= 3 ? 's' + i : 'u' + (i - 3)),
  },
};

// 孩子的 grade 写的是中文（"七年级"），这里统一换成 g7 这样的代号
export function gcode(u) {
  const m = /([一二三四五六七八九])/.exec((u && u.grade) || '');
  return m ? 'g' + (CN[m[1]] || 0) : '';
}
export const ginfo = (u) => GRADES[gcode(u)] || null;

// 英语卷子第 i 单元对应的听力题集号（没有配过 engUnit 的年级一律按 u 打头）
export const engUnit = (g, i) => {
  const f = GRADES[g] && GRADES[g].engUnit;
  return f ? f(i) : 'u' + i;
};

// 每份英语卷子里【实际印着】的听力二维码指向哪，是把 20 份 docx 逐个解码出来的真实值。
// 不要改成推导规则——以前按「七年级那套 s/u 规律」推四年级的期中期末卷，
// 推出来 g4l-s1-1、g4l-u7-1 根本不存在，卷子后面的 🎧 点了就是个空页，谁都没发现。
// 卷子改动或新增后，跑 python tools/check_data.py 会告诉你这张表有没有跟上。
export const PAPER_HEARS = {
  'g4-eng-1': ['g4l-u1-3', 'g4l-u1-4'],
  'g4-eng-2': ['g4l-u2-3', 'g4l-u2-4'],
  'g4-eng-3': ['g4l-u3-3', 'g4l-u3-4'],
  'g4-eng-4': ['g4l-u4-3', 'g4l-u4-4'],
  'g4-eng-5': ['g4l-u5-3', 'g4l-u5-4'],
  'g4-eng-6': ['g4l-u6-3', 'g4l-u6-4'],
  'g4-eng-mid': ['g4l-u1-1', 'g4l-u3-1'],
  'g4-eng-fin': ['g4l-u1-1', 'g4l-u3-1', 'g4l-u6-1'],
  'g7-eng-1': ['g7l-s1-3', 'g7l-s1-4'],
  'g7-eng-2': ['g7l-s2-3', 'g7l-s2-4'],
  'g7-eng-3': ['g7l-s3-3', 'g7l-s3-4'],
  'g7-eng-4': ['g7l-u1-3', 'g7l-u1-4'],
  'g7-eng-5': ['g7l-u2-3', 'g7l-u2-4'],
  'g7-eng-6': ['g7l-u3-3', 'g7l-u3-4'],
  'g7-eng-7': ['g7l-u4-3', 'g7l-u4-4'],
  'g7-eng-8': ['g7l-u5-3', 'g7l-u5-4'],
  'g7-eng-9': ['g7l-u6-3', 'g7l-u6-4'],
  'g7-eng-10': ['g7l-u7-3', 'g7l-u7-4'],
  'g7-eng-mid': ['g7l-s1-1', 'g7l-u3-1'],
  'g7-eng-fin': ['g7l-s1-1', 'g7l-u2-1', 'g7l-u7-1'],
};
