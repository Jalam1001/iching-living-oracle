#!/usr/bin/env python3
"""Builds www/data/iching.json from:
  - sources/legge_raw.json  (James Legge, The Yi King, SBE vol. 16, 1882 — public domain)
  - content/*.txt           (original modern plain-English interpretations written for this project)
The hexagram line patterns are generated here from the classic King Wen trigram-pair matrix.
They are verified independently in tests/unit against Wikipedia's list and Legge's NINE/SIX labels."""
import json, re, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Trigrams: lines bottom->top, 1 = yang (solid), 0 = yin (broken)
TRIGRAMS = [
 dict(key='qian', name='Qián', zh='乾', sym='☰', image='Heaven', bits='111', quality='Creative, strong', family='Father', direction='Northwest', body='Head', animal='Horse', season='Late autumn',
      text='Three solid lines: pure yang. Qián is the energy of heaven, tireless, creative and initiating. It stands for strength, leadership and persistence.'),
 dict(key='kun', name='Kūn', zh='坤', sym='☷', image='Earth', bits='000', quality='Receptive, yielding', family='Mother', direction='Southwest', body='Belly', animal='Cow', season='Late summer',
      text='Three broken lines: pure yin. Kūn is the earth that receives, supports and nourishes everything. It stands for devotion, patience and care.'),
 dict(key='zhen', name='Zhèn', zh='震', sym='☳', image='Thunder', bits='100', quality='Arousing, moving', family='Eldest son', direction='East', body='Foot', animal='Dragon', season='Spring',
      text='One solid line beneath two broken lines: energy bursting up from below. Zhèn is thunder, shock and the first stirring of new life in spring.'),
 dict(key='xun', name='Xùn', zh='巽', sym='☴', image='Wind / Wood', bits='011', quality='Gentle, penetrating', family='Eldest daughter', direction='Southeast', body='Thighs', animal='Rooster', season='Early summer',
      text='One broken line beneath two solid lines. Xùn is wind and the roots of trees: gentle influence that penetrates everywhere through persistence.'),
 dict(key='kan', name='Kǎn', zh='坎', sym='☵', image='Water', bits='010', quality='Abysmal, dangerous', family='Middle son', direction='North', body='Ear', animal='Pig', season='Winter',
      text='A solid line held between two broken lines, like water flowing in a ravine. Kǎn is danger and depth, but also sincerity and the courage to keep flowing.'),
 dict(key='li', name='Lí', zh='離', sym='☲', image='Fire', bits='101', quality='Clinging, bright', family='Middle daughter', direction='South', body='Eye', animal='Pheasant', season='Summer',
      text='A broken line held between two solid lines: an empty center that shines. Lí is fire and light, clarity and awareness, which must cling to something to burn.'),
 dict(key='gen', name='Gèn', zh='艮', sym='☶', image='Mountain', bits='001', quality='Still, resting', family='Youngest son', direction='Northeast', body='Hand', animal='Dog', season='Late winter',
      text='One solid line resting on two broken lines, like a mountain on the earth. Gèn is stillness, meditation and knowing when to stop.'),
 dict(key='dui', name='Duì', zh='兌', sym='☱', image='Lake', bits='110', quality='Joyous, open', family='Youngest daughter', direction='West', body='Mouth', animal='Sheep', season='Autumn',
      text='One broken line above two solid lines, like the open surface of a lake. Duì is joy, conversation and the pleasure of sharing.'),
]
# Classic King Wen lookup: KW[lower][upper] using the order qian, zhen, kan, gen, kun, xun, li, dui
ORDER = ['qian','zhen','kan','gen','kun','xun','li','dui']
KW = [
 [ 1, 34,  5, 26, 11,  9, 14, 43],  # lower qian
 [25, 51,  3, 27, 24, 42, 21, 17],  # lower zhen
 [ 6, 40, 29,  4,  7, 59, 64, 47],  # lower kan
 [33, 62, 39, 52, 15, 53, 56, 31],  # lower gen
 [12, 16,  8, 23,  2, 20, 35, 45],  # lower kun
 [44, 32, 48, 18, 46, 57, 50, 28],  # lower xun
 [13, 55, 63, 22, 36, 37, 30, 49],  # lower li
 [10, 54, 60, 41, 19, 61, 38, 58],  # lower dui
]
TB = {t['key']: t for t in TRIGRAMS}
NAMES = """乾|Qián|Khien
坤|Kūn|Khwăn
屯|Zhūn|Kun
蒙|Méng|Măng
需|Xū|Hsü
訟|Sòng|Sung
師|Shī|Sze
比|Bǐ|Pî
小畜|Xiǎo Xù|Hsiâo Khû
履|Lǚ|Lî
泰|Tài|Thâi
否|Pǐ|Phî
同人|Tóng Rén|Thung Zăn
大有|Dà Yǒu|Tâ Yû
謙|Qiān|Khien
豫|Yù|Yü
隨|Suí|Sui
蠱|Gǔ|Kû
臨|Lín|Lin
觀|Guān|Kwân
噬嗑|Shì Kè|Shih Ho
賁|Bì|Pî
剝|Bō|Po
復|Fù|Fû
無妄|Wú Wàng|Wû Wang
大畜|Dà Xù|Tâ Khû
頤|Yí|Î
大過|Dà Guò|Tâ Kwo
坎|Kǎn|Khan
離|Lí|Lî
咸|Xián|Hsien
恆|Héng|Hăng
遯|Dùn|Thun
大壯|Dà Zhuàng|Tâ Kwang
晉|Jìn|Zin
明夷|Míng Yí|Ming Î
家人|Jiā Rén|Kia Zăn
睽|Kuí|Khwei
蹇|Jiǎn|Kien
解|Xiè|Kieh
損|Sǔn|Sun
益|Yì|Yî
夬|Guài|Kwai
姤|Gòu|Kâu
萃|Cuì|Zhui
升|Shēng|Shăng
困|Kùn|Khwăn
井|Jǐng|Zing
革|Gé|Ko
鼎|Dǐng|Ting
震|Zhèn|Kăn
艮|Gèn|Kăn
漸|Jiàn|Kien
歸妹|Guī Mèi|Kwei Mei
豐|Fēng|Făng
旅|Lǚ|Lü
巽|Xùn|Sun
兌|Duì|Tui
渙|Huàn|Hwan
節|Jié|Kieh
中孚|Zhōng Fú|Kung Fû
小過|Xiǎo Guò|Hsiâo Kwo
既濟|Jì Jì|Kî Žî
未濟|Wèi Jì|Wei Žî""".split('\n')

def parse_content():
    hexes = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'content', 'hex*.txt'))):
        cur = None
        for raw in open(f, encoding='utf-8'):
            line = raw.rstrip('\n')
            if not line.strip(): continue
            m = re.match(r'^@(\d+) \| (.+?) \| (.+)$', line)
            if m:
                cur = {'n': int(m.group(1)), 'en': m.group(2).strip(), 'alt': m.group(3).strip(), 'lines': {}}
                hexes[cur['n']] = cur; continue
            m = re.match(r'^(\d): (.+)$', line)
            if m: cur['lines'][int(m.group(1))] = m.group(2).strip(); continue
            m = re.match(r'^(\w+): (.+)$', line)
            if m:
                k, v = m.group(1), m.group(2).strip()
                if k in ('do', 'avoid', 'key'): v = [x.strip() for x in re.split(r';\s*', v) if x.strip()]
                cur[k] = v; continue
            raise SystemExit(f'Unparsed line in {f}: {line!r}')
    for f in sorted(glob.glob(os.path.join(ROOT, 'content', 'lines-revised-*.txt'))):
        cur = None
        for raw in open(f, encoding='utf-8'):
            line = raw.strip()
            if not line: continue
            m = re.match(r'^@(\d+)$', line)
            if m: cur = hexes[int(m.group(1))]; continue
            m = re.match(r'^(\d): (.+)$', line)
            if m: cur['lines'][int(m.group(1))] = m.group(2).strip(); continue
            raise SystemExit(f'Unparsed line in {f}: {line!r}')
    return hexes

def clean(s):
    s = re.sub(r'\s+', ' ', s).strip()
    s = s.replace(' .', '.').replace('his own. dignified', 'his own dignified').replace('tinder restraint', 'under restraint')
    s = s.replace('T he ', 'The ').replace(' n a high', ' in a high').replace('shows. its', 'shows its').replace('natural. course', 'natural course')
    s = s.replace('[paragraph continues] ', '')
    return s

def main():
    legge = json.load(open(os.path.join(ROOT, 'sources', 'legge_raw.json'), encoding='utf-8'))
    content = parse_content()
    out = []
    for ui, up in enumerate(ORDER):
        for li, lo in enumerate(ORDER):
            n = KW[li][ui]
            zh, py, lg = NAMES[n-1].split('|')
            c = content.get(n)
            if not c: raise SystemExit(f'missing content for {n}')
            L = legge['text'][n-1]
            h = {
                'n': n, 'zh': zh, 'pinyin': py, 'legge': lg, 'name': c['en'], 'alt': c['alt'],
                'glyph': chr(0x4DC0 + n - 1),
                'lower': lo, 'upper': up,
                'bits': TB[lo]['bits'] + TB[up]['bits'],
                'keywords': c['key'], 'core': c['core'], 'now': c['now'], 'dir': c['dir'],
                'do': c['do'], 'avoid': c['avoid'], 'love': c['love'], 'work': c['work'], 'self': c['self'],
                'jung': c['jung'], 'example': c['ex'],
                'judgment': clean(L['judgment']), 'image': clean(legge['image'][str(n)]),
                'lines': [{'legge': clean(L['lines'][i]), 'plain': c['lines'][i+1]} for i in range(6)],
            }
            if n in (1, 2):
                h['allLines'] = {'legge': clean(L['extra']), 'plain': c['lines'][7]}
            out.append(h)
    out.sort(key=lambda h: h['n'])
    assert [h['n'] for h in out] == list(range(1, 65))
    assert len({h['bits'] for h in out}) == 64
    for h in out:
        for k in ('core','now','dir','love','work','self','jung','example','judgment','image'):
            assert h[k] and len(h[k]) > 20, (h['n'], k)
        assert all(l['legge'] and l['plain'] for l in h['lines']), h['n']
        assert re.match(r'^(a|an|the) ', h['core']), (h['n'], h['core'])
    db = {'version': '0.1', 'source': {
            'classical': 'James Legge (trans.), The Yi King, Sacred Books of the East vol. 16 (Oxford, 1882; 2nd ed. 1899). Public domain. Text via the Internet Sacred Text Archive.',
            'modern': 'Plain-English interpretations, practical guidance and Jungian notes written for I Ching — The Living Oracle (MIT/CC BY 4.0).'},
          'trigrams': TRIGRAMS, 'hexagrams': out}
    p = os.path.join(ROOT, 'www', 'data', 'iching.json')
    json.dump(db, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('wrote', p, os.path.getsize(p), 'bytes;', len(out), 'hexagrams;', sum(len(h['lines']) for h in out), 'lines')

if __name__ == '__main__':
    main()
