/* ===== data.js — 主题数据、文化内容、成就定义 ===== */

/** 文化主题定义 */
const THEMES = [
  {
    id: 'gugong',
    name: '故宫',
    shortDesc: '紫禁城 · 皇家宫殿',
    colors: ['#8B0000', '#C41E3A', '#D4A574', '#F2D398', '#4A1A1A'],
    // 通关后文化介绍
    culture: {
      title: '故宫 — 紫禁城',
      content: `北京故宫，旧称紫禁城，位于北京中轴线的中心，是明清两代的皇家宫殿。故宫以三大殿为中心，占地面积约72万平方米，建筑面积约15万平方米，有大小宫殿七十多座，房屋九千余间。

故宫是世界上现存规模最大、保存最为完整的木质结构古建筑群之一，1987年被联合国教科文组织列为世界文化遗产。

太和殿（俗称金銮殿）是故宫中最高大、最辉煌的建筑，是中国古代宫殿建筑的代表之作。故宫建筑群充分体现了"前朝后寝""左祖右社"的中国传统都城规划理念，是中华建筑艺术的瑰宝。`,
    },
    // canvas 绘制函数需要的风格参数
    drawStyle: 'palace',
  },
  {
    id: 'changcheng',
    name: '长城',
    shortDesc: '万里长城 · 雄伟壮丽',
    colors: ['#2D5016', '#5A7D3A', '#8B7355', '#A0A0A0', '#3E5C1E'],
    culture: {
      title: '长城 — 中华民族的脊梁',
      content: `长城（Great Wall），又称万里长城，是中国古代的军事防御工程，是一道高大、坚固而连绵不断的长垣，用以限隔敌骑的行动。长城不是一道单纯孤立的城墙，而是以城墙为主体，同大量的城、障、亭、标相结合的防御体系。

长城修筑的历史可上溯到西周时期，秦灭六国统一天下后，秦始皇连接和修缮战国长城，始有万里长城之称。明朝是最后一个大修长城的朝代，今天人们所看到的长城多是明长城。

1987年，长城被联合国教科文组织列为世界文化遗产。长城象征着中华民族坚韧不屈的精神，是中华文明的重要标志。`,
    },
    drawStyle: 'wall',
  },
  {
    id: 'dunhuang',
    name: '敦煌莫高窟',
    shortDesc: '丝路明珠 · 佛教艺术宝库',
    colors: ['#D2691E', '#E8B86D', '#87CEEB', '#5F9EA0', '#8B4513'],
    culture: {
      title: '敦煌莫高窟 — 东方艺术明珠',
      content: `莫高窟，俗称千佛洞，坐落在河西走廊西端的敦煌。它始建于十六国的前秦时期，历经十六国、北朝、隋、唐、五代、西夏、元等历代的兴建，形成巨大的规模，有洞窟735个，壁画4.5万平方米、泥质彩塑2415尊，是世界上现存规模最大、内容最丰富的佛教艺术地。

莫高窟的壁画和彩塑艺术成就极高，内容涵盖了佛教故事、古代建筑、音乐舞蹈、农耕商贸等方方面面，被誉为"墙壁上的图书馆"和"东方艺术明珠"。

1987年，莫高窟被列为世界文化遗产。敦煌学已成为一门国际显学，吸引着世界各地的学者前来研究这座人类文明的宝库。`,
    },
    drawStyle: 'cave',
  },
  {
    id: 'yuanlin',
    name: '苏州园林',
    shortDesc: '江南园林 · 移步换景',
    colors: ['#228B22', '#6B8E6E', '#87CEEB', '#F5F5DC', '#556B2F'],
    culture: {
      title: '苏州古典园林 — 咫尺之内再造乾坤',
      content: `苏州古典园林，亦称"苏州园林"，溯源于春秋，发展于晋唐，繁荣于两宋，全盛于明清，是位于江苏省苏州市境内的中国古典园林的总称。苏州古典园林所蕴涵的中华哲学、历史、人文习俗是江南人文历史传统、地方风俗的一种象征和浓缩。

苏州园林以拙政园、留园、网师园、环秀山庄等为代表，以其古、秀、精、雅而享有"江南园林甲天下，苏州园林甲江南"之誉。

1997年和2000年，苏州古典园林先后被联合国教科文组织列为世界文化遗产。苏州园林以"咫尺之内再造乾坤"的艺术手法，将自然山水浓缩于方寸之间，是中国园林艺术的杰出代表。`,
    },
    drawStyle: 'garden',
  },
  {
    id: 'bingmayong',
    name: '兵马俑',
    shortDesc: '秦陵兵马俑 · 世界第八大奇迹',
    colors: ['#B8860B', '#D2B48C', '#8B7355', '#A0522D', '#CD853F'],
    culture: {
      title: '秦始皇兵马俑 — 世界第八大奇迹',
      content: `秦始皇兵马俑，简称秦兵马俑或秦俑，是第一批全国重点文物保护单位、第一批中国世界遗产，位于今陕西省西安市临潼区秦始皇陵以东1.5千米处的兵马俑坑内。

兵马俑是古代墓葬雕塑的一个类别。古代施行人殉，奴隶是奴隶主生前的附属品，奴隶主死后奴隶要作为殉葬品为奴隶主陪葬。兵马俑即制成兵马（战车、战马、士兵）形状的殉葬品。

1987年，秦始皇陵及兵马俑坑被联合国教科文组织列为世界文化遗产。兵马俑的发现被誉为"世界第八大奇迹"，先后有200多位外国元首和政府首脑参观访问，是中国古代辉煌文明的一张金字名片。`,
    },
    drawStyle: 'warrior',
  },
  {
    id: 'huangshan',
    name: '黄山',
    shortDesc: '奇松怪石 · 天下第一奇山',
    colors: ['#2F4F4F', '#4682B4', '#87CEEB', '#F0E68C', '#556B2F'],
    culture: {
      title: '黄山 — 天下第一奇山',
      content: `黄山，位于安徽省南部黄山市境内，是中国十大风景名胜唯一的山岳风光。黄山原名"黟山"，因峰岩青黑，遥望苍黛而名。后因传说轩辕黄帝曾在此炼丹，故改名为"黄山"。

黄山以"五绝"著称于世：奇松（迎客松为代表）、怪石（飞来石等）、云海、温泉、冬雪。明朝旅行家徐霞客登临黄山时赞叹："薄海内外之名山，无如徽之黄山。登黄山，天下无山，观止矣！"后人引申为"五岳归来不看山，黄山归来不看岳"。

1990年，黄山被联合国教科文组织列为世界文化与自然双重遗产。黄山不仅自然景观奇绝，还与徽州文化密不可分，是中国山水文化的典型代表。`,
    },
    drawStyle: 'mountain',
  },
];

/** 难度设置 */
const DIFFICULTIES = {
  3: { size: 3, label: '入门', timeLimit: 120, moveLimit: 90, basePoints: 300 },
  4: { size: 4, label: '进阶', timeLimit: 300, moveLimit: 160, basePoints: 400 },
  5: { size: 5, label: '大师', timeLimit: 600, moveLimit: 250, basePoints: 500 },
};

/** 成就徽章定义 */
const REWARDS = [
  { id: 'beginner', name: '初学乍练', icon: '🌟', points: 500 },
  { id: 'enthusiast', name: '文化爱好者', icon: '📚', points: 1500 },
  { id: 'expert', name: '拼图达人', icon: '🧩', points: 3000 },
  { id: 'master', name: '华容大师', icon: '🏅', points: 5000 },
  { id: 'legend', name: '文化传承者', icon: '👑', points: 10000 },
];

/**
 * 在 Canvas 上绘制主题图案（生成"原图"用于拼图）
 * @param {string} themeId 主题ID
 * @param {number} size 画布尺寸（像素）
 * @returns {HTMLCanvasElement}
 */
function generateThemeImage(themeId, size = 300) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return null;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const w = size;
  const h = size;
  const colors = theme.colors;

  switch (theme.drawStyle) {
    case 'palace':
      drawPalace(ctx, w, h, colors);
      break;
    case 'wall':
      drawWall(ctx, w, h, colors);
      break;
    case 'cave':
      drawCave(ctx, w, h, colors);
      break;
    case 'garden':
      drawGarden(ctx, w, h, colors);
      break;
    case 'warrior':
      drawWarrior(ctx, w, h, colors);
      break;
    case 'mountain':
      drawMountain(ctx, w, h, colors);
      break;
    default:
      drawDefault(ctx, w, h, colors);
  }

  // 叠加主题文字
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, h - 50, w, 50);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px "KaiTi", "STKaiti", "Microsoft YaHei", serif';
  ctx.textAlign = 'center';
  ctx.fillText(theme.name, w / 2, h - 14);

  return canvas;
}

/* ------ 各主题绘制函数 ------ */

function drawPalace(ctx, w, h, colors) {
  // 天空
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  skyGrad.addColorStop(0, '#1a1a4e');
  skyGrad.addColorStop(0.7, '#c4a45a');
  skyGrad.addColorStop(1, colors[3]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.6);

  // 宫殿主体
  ctx.fillStyle = colors[0];
  ctx.fillRect(w * 0.1, h * 0.3, w * 0.8, h * 0.4);

  // 屋顶（重檐）
  ctx.fillStyle = colors[1];
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.3);
  ctx.lineTo(w * 0.5, h * 0.1);
  ctx.lineTo(w * 0.95, h * 0.3);
  ctx.closePath();
  ctx.fill();

  // 金色瓦顶
  ctx.strokeStyle = colors[3];
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = w * 0.15 + i * w * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.3);
    ctx.lineTo(x - w * 0.04, h * 0.2 + Math.random() * h * 0.05);
    ctx.stroke();
  }

  // 柱子
  ctx.fillStyle = colors[2];
  for (let i = 0; i < 5; i++) {
    const x = w * 0.17 + i * w * 0.16;
    ctx.fillRect(x - w * 0.015, h * 0.42, w * 0.03, h * 0.28);
  }

  // 台阶
  ctx.fillStyle = '#ddd';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(w * 0.2 + i * w * 0.02, h * 0.7 + i * h * 0.04, w * 0.6 - i * w * 0.04, h * 0.02);
  }

  // 红墙底部
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, h * 0.75, w, h * 0.25);
}

function drawWall(ctx, w, h, colors) {
  // 天空
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#4a90d9');
  skyGrad.addColorStop(0.6, '#c4dced');
  skyGrad.addColorStop(1, colors[1]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 远山
  ctx.fillStyle = colors[2];
  ctx.beginPath();
  ctx.moveTo(0, h * 0.55);
  for (let i = 0; i <= w; i += w / 8) {
    ctx.lineTo(i, h * 0.55 - Math.sin(i / w * Math.PI * 2) * h * 0.15);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 长城城墙
  ctx.fillStyle = colors[3];
  ctx.beginPath();
  let wallY = h * 0.5;
  for (let x = 0; x <= w; x += 2) {
    const y = wallY + Math.sin(x / w * Math.PI * 3) * h * 0.15;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h * 0.55);
  ctx.lineTo(0, h * 0.55);
  ctx.closePath();
  ctx.fill();

  // 城墙上的垛口
  ctx.fillStyle = colors[3];
  for (let i = 0; i < 6; i++) {
    const bx = w * 0.1 + i * w * 0.15;
    const by = wallY + Math.sin((bx / w) * Math.PI * 3) * h * 0.15 - h * 0.05;
    ctx.fillRect(bx, by, w * 0.06, h * 0.08);
    ctx.fillStyle = '#666';
    ctx.fillRect(bx + w * 0.015, by + h * 0.01, w * 0.03, h * 0.03);
    ctx.fillStyle = colors[3];
  }

  // 近山绿植
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
}

function drawCave(ctx, w, h, colors) {
  // 沙漠天空
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  skyGrad.addColorStop(0, '#d4a35a');
  skyGrad.addColorStop(1, colors[1]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.5);

  // 沙漠
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, h * 0.45, w, h * 0.2);

  // 沙丘纹理
  ctx.fillStyle = colors[4];
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  for (let x = 0; x <= w; x += w / 12) {
    ctx.lineTo(x, h * 0.48 + Math.sin(x / w * 8) * h * 0.03);
  }
  ctx.lineTo(w, h * 0.65);
  ctx.lineTo(0, h * 0.65);
  ctx.closePath();
  ctx.fill();

  // 莫高窟崖面
  ctx.fillStyle = colors[4];
  ctx.fillRect(w * 0.1, h * 0.15, w * 0.8, h * 0.55);

  // 洞窟
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const cx = w * 0.17 + col * w * 0.16;
      const cy = h * 0.22 + row * h * 0.16;
      ctx.fillStyle = '#1a1008';
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.045, 0, Math.PI * 2);
      ctx.fill();
      // 佛像光晕
      ctx.fillStyle = colors[1];
      ctx.beginPath();
      ctx.arc(cx, cy - w * 0.01, w * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 飞天飘带
  ctx.strokeStyle = colors[2];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.2);
  ctx.quadraticCurveTo(w * 0.3, h * 0.1, w * 0.5, h * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.3);
  ctx.quadraticCurveTo(w * 0.7, h * 0.5, w * 0.95, h * 0.25);
  ctx.stroke();
}

function drawGarden(ctx, w, h, colors) {
  // 天空
  ctx.fillStyle = colors[2];
  ctx.fillRect(0, 0, w, h * 0.35);

  // 水面
  const waterGrad = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.8);
  waterGrad.addColorStop(0, colors[2]);
  waterGrad.addColorStop(0.3, '#a8d8ea');
  waterGrad.addColorStop(1, colors[1]);
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, h * 0.35, w, h * 0.45);

  // 水纹
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = h * 0.45 + i * h * 0.06;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 4) {
      ctx.lineTo(x, y + Math.sin(x / 20 + i) * 3);
    }
    ctx.stroke();
  }

  // 亭子
  const pavX = w * 0.6, pavY = h * 0.35;
  ctx.fillStyle = colors[4];
  ctx.fillRect(pavX - w * 0.06, pavY + h * 0.08, w * 0.12, h * 0.12);
  // 亭顶
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.moveTo(pavX - w * 0.1, pavY + h * 0.08);
  ctx.lineTo(pavX, pavY - h * 0.02);
  ctx.lineTo(pavX + w * 0.1, pavY + h * 0.08);
  ctx.closePath();
  ctx.fill();
  // 飞檐
  ctx.beginPath();
  ctx.moveTo(pavX - w * 0.1, pavY + h * 0.08);
  ctx.quadraticCurveTo(pavX - w * 0.15, pavY + h * 0.04, pavX - w * 0.13, pavY + h * 0.01);
  ctx.strokeStyle = colors[4];
  ctx.lineWidth = 2;
  ctx.stroke();

  // 假山
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.65);
  ctx.quadraticCurveTo(w * 0.18, h * 0.5, w * 0.22, h * 0.48);
  ctx.quadraticCurveTo(w * 0.28, h * 0.5, w * 0.3, h * 0.55);
  ctx.quadraticCurveTo(w * 0.25, h * 0.6, w * 0.3, h * 0.65);
  ctx.closePath();
  ctx.fill();

  // 柳树
  ctx.fillStyle = colors[0];
  ctx.fillRect(w * 0.35, h * 0.2, w * 0.03, h * 0.4);
  ctx.fillStyle = '#3a8';
  ctx.beginPath();
  ctx.arc(w * 0.36, h * 0.18, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // 垂柳
  ctx.strokeStyle = '#3a8';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.32 + i * w * 0.02, h * 0.22);
    ctx.quadraticCurveTo(w * 0.3 + i * w * 0.02, h * 0.3 + i * h * 0.02, w * 0.3 + i * w * 0.015, h * 0.45);
    ctx.stroke();
  }

  // 底部地面
  ctx.fillStyle = colors[4];
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
}

function drawWarrior(ctx, w, h, colors) {
  // 背景：大地色调
  ctx.fillStyle = colors[1];
  ctx.fillRect(0, 0, w, h);

  // 地面
  ctx.fillStyle = colors[2];
  ctx.fillRect(0, h * 0.75, w, h * 0.25);

  // 主武士（正面）
  const cx = w * 0.45, cy = h * 0.4;
  const bw = w * 0.18, bh = h * 0.35;

  // 身体
  ctx.fillStyle = colors[0];
  ctx.fillRect(cx - bw / 2, cy, bw, bh);

  // 甲片纹理
  ctx.strokeStyle = colors[4];
  ctx.lineWidth = 1;
  for (let y = cy; y < cy + bh; y += bh / 8) {
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2, y);
    ctx.lineTo(cx + bw / 2, y);
    ctx.stroke();
    for (let x = cx - bw / 2; x < cx + bw / 2; x += bw / 3) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + bw / 6, y + bh / 16);
      ctx.stroke();
    }
  }

  // 头部
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.arc(cx, cy - bw * 0.3, bw * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // 发髻
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(cx - bw * 0.12, cy - bw * 0.75, bw * 0.24, bw * 0.25);

  // 面部
  ctx.fillStyle = colors[1];
  ctx.beginPath();
  ctx.arc(cx, cy - bw * 0.28, bw * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // 第二排武士（稍小）
  for (let i = 0; i < 3; i++) {
    const sx = w * 0.2 + i * w * 0.18;
    const sy = h * 0.5;
    const sb = w * 0.12;
    ctx.fillStyle = colors[3];
    ctx.fillRect(sx - sb / 2, sy, sb, sb * 1.3);
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.arc(sx, sy - sb * 0.2, sb * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 右下角战马
  const hx = w * 0.75, hy = h * 0.65;
  ctx.fillStyle = colors[4];
  ctx.beginPath();
  ctx.ellipse(hx, hy, w * 0.08, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hx - w * 0.06, hy - h * 0.1, w * 0.04, h * 0.08);
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(hx - w * 0.02, hy - h * 0.16, w * 0.06, h * 0.08);
}

function drawMountain(ctx, w, h, colors) {
  // 天空渐变
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  skyGrad.addColorStop(0, '#1a3a5c');
  skyGrad.addColorStop(1, colors[2]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.5);

  // 太阳
  ctx.fillStyle = colors[4];
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.2, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  // 光晕
  ctx.fillStyle = 'rgba(240,230,140,0.2)';
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.2, w * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 云海
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 8; i++) {
    const cx = w * 0.1 + i * w * 0.14;
    const cy = h * 0.35 + Math.sin(i * 1.5) * h * 0.04;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 主峰
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.7);
  ctx.lineTo(w * 0.35, h * 0.2);
  ctx.lineTo(w * 0.55, h * 0.35);
  ctx.lineTo(w * 0.5, h * 0.45);
  ctx.lineTo(w * 0.65, h * 0.25);
  ctx.lineTo(w * 0.9, h * 0.55);
  ctx.lineTo(w * 0.95, h * 0.7);
  ctx.closePath();
  ctx.fill();

  // 主峰亮面
  ctx.fillStyle = colors[1];
  ctx.beginPath();
  ctx.moveTo(w * 0.35, h * 0.2);
  ctx.lineTo(w * 0.28, h * 0.5);
  ctx.lineTo(w * 0.35, h * 0.55);
  ctx.lineTo(w * 0.42, h * 0.38);
  ctx.closePath();
  ctx.fill();

  // 迎客松
  const tx = w * 0.5, ty = h * 0.42;
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(tx - w * 0.01, ty, w * 0.02, h * 0.08);
  ctx.fillStyle = colors[4];
  ctx.beginPath();
  ctx.arc(tx - w * 0.04, ty - h * 0.02, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(tx + w * 0.03, ty + h * 0.02, w * 0.04, 0, Math.PI * 2);
  ctx.fill();
  // 伸出枝干
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx, ty + h * 0.02);
  ctx.lineTo(tx - w * 0.08, ty - h * 0.01);
  ctx.stroke();

  // 底部
  ctx.fillStyle = colors[4];
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
}

function drawDefault(ctx, w, h, colors) {
  // 简单渐变图案
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 装饰几何
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.15, 0, Math.PI * 2);
  ctx.fill();
}
