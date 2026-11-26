import re,html,json,glob
import os,sys
D=os.environ.get('LEGGE_HTML_DIR','sources/legge-html/')
def body(f):
  t=open(f,encoding='utf-8').read()
  s=t[t.find('data-slot="ad-content"'):]
  k=s.find('<section aria-labelledby="reader-footnotes'); s=s[:k] if k>0 else s
  s=s[:s.find('</article>')]
  s=re.sub(r'<!--.*?-->','',s,flags=re.S); s=re.sub(r'<!--.*','',s)
  s=re.sub(r'<a href="[^"]*#fn_[^"]*">[^<]*</a>','',s)
  s=re.sub(r'</p>|<br\s*/?>|</h\d>','\n',s); s=re.sub('<[^>]+>','',s); s=html.unescape(s)
  s=s.replace('data-slot="ad-content">','')
  return [l.strip() for l in s.split('\n') if l.strip() and not re.fullmatch(r'p\. \d+',l.strip())]
out=[]
for n in range(1,65):
  L=body(D+'ic%02d.htm'%n)
  ORD={'first':1,'second':2,'third':3,'fourth':4,'fifth':5,'sixth':6,'topmost':6}
  def fix(l):
    l=re.sub(r'^S\.\s','5. ',l); l=re.sub(r'^I\.\s(The first)',r'1. \1',l); l=re.sub(r'^(\d) \.',r'\1.',l)
    m=re.match(r'^(?:In the|The) (first|second|third|fourth|fifth|sixth|topmost)( \(or [a-z]+\))? (SIX|NINE)',l)
    if m: l='%d. '%ORD[m.group(1)]+l
    return l
  L=[fix(l) for l in L]
  L=[l for l in L if not l.startswith('Explanation of the') and not l.startswith('TEXT SECTION')]
  title=L[0]
  j=next(k for k,l in enumerate(L) if re.match(r'^1\.\s',l))
  judg=' '.join(L[1:j]); j=j-1
  lines={}
  cur=None
  for l in L[j+1:]:
    m=re.match(r'^(\d)\.\s+(.*)',l)
    if m: cur=int(m.group(1)); lines[cur]=m.group(2)
    elif cur and not l.startswith('Footnote'): lines[cur]+=' '+l
  out.append({'n':n,'title':title,'judgment':judg,'lines':[lines.get(k,'') for k in range(1,7)],'extra':lines.get(7)})
# images
img={}; small={}
for f in ['section-i-2.htm','section-ii-2.htm']:
  L=body(D+f); cur=None; buf=[]
  roman=re.compile(r'^([IVXL]+)\.?\s+(.*)')
  def rn(s):
    v={'I':1,'V':5,'X':10,'L':50};t=0
    for a,b in zip(s,s[1:]+' '):
      t+= -v[a] if b!=' ' and v.get(b,0)>v[a] else v[a]
    return t
  last=None
  for l in L:
    m=roman.match(l)
    if m and rn(m.group(1))<=64 and (last is None or rn(m.group(1))==last+1):
      cur=rn(m.group(1)); last=cur; img[cur]=m.group(2); mode='img'; continue
    if cur is None: continue
    mm=re.match(r'^([\dS])\.\s+(.*)',l)
    if mm: mode='line'; continue
    if mode=='img' and not l.startswith('Footnote'): img[cur]+=' '+l
json.dump({'text':out,'image':img},open('sources/legge_raw.json','w'),indent=1,ensure_ascii=False)
print(len(out),len(img), sorted(set(range(1,65))-set(img)))
for o in out:
  bad=[k+1 for k,x in enumerate(o['lines']) if not x]
  if bad or not o['judgment']: print('MISSING',o['n'],bad)
print(out[32]); print(img[33]); print(out[0]['extra'],out[1]['extra'])
