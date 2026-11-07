import json, re, random, os, sys
S=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
signs=json.load(open(f'{S}/source/signs.json'))
def parse(fn, section):
    qs=[]; cur=None; topic=None
    def flush():
        nonlocal cur
        if cur and cur.get('q'):
            assert sum(o['c'] for o in cur['opts'])==1, (fn, cur['q'])
            assert len(cur['opts'])==3, (fn, cur['q'], len(cur['opts']))
            qs.append(cur)
        cur=None
    for line in open(fn, encoding='utf8'):
        line=line.rstrip('\n')
        if line.startswith('#'): continue
        if not line.strip(): flush(); continue
        if cur is None: cur={'section':section,'topic':topic,'opts':[],'q':''}
        if line.startswith('@ '): topic=line[2:].strip(); cur['topic']=topic
        elif line=='D': cur['diagram']=1
        elif line=='D auto': cur['diagram']='auto'
        elif line=='F': cur['fixed']=1
        elif line.startswith('I '): 
            k=line[2:].strip(); cur['img']=k
            if k in signs: pass
            else: assert os.path.exists(f'{S}/public/img/marks/{k}.svg'), k
        elif line.startswith('Q '): cur['q']=line[2:].strip()
        elif line.startswith('-* '): cur['opts'].append({'t':line[3:].strip(),'c':1})
        elif line.startswith('- '): cur['opts'].append({'t':line[2:].strip(),'c':0})
        elif line.startswith('E '): cur['exp']=line[2:].strip()
        elif line.startswith('R '): cur['src']=line[2:].strip()
        else:
            if cur['opts']: raise Exception(f'bad line {fn}: {line}')
            cur['q']+='\n'+line.strip()
    flush(); return qs
qs=parse(f'{S}/source/rules.txt','rules')+parse(f'{S}/source/controls.txt','controls')+parse(f'{S}/source/signs.txt','signs')
# auto sign questions
fam=[{'speed-100','speed-60','speed-100-t'},{'mc-only','mc-only-t'},{'no-left-ahead','no-left'},{'no-right-ahead','no-right'},
 {'height-limit','height-restricted'},{'width-limit','width-warning'},{'railway','railway-crossbuck','gate'},{'stop-go','stop-go-ahead'},
 {'freeway','freeway-single'},{'emergency-light','general-warning','police-light'},{'stop','stop-3way','stop-4way','stop-yield','stop-go'},
 {'yield','yield-ped','yield-circle','yield-oncoming','yield-ahead','stop-yield'},{'crossroad','priority-crossroad','secondary-crossroad'},
 {'turn-left','proceed-left','oneway-left'},{'chevron','sharp-curve-left','sharp-curve-right','gentle-curve-left','gentle-curve-right','hairpin-left','hairpin-right','winding-road'},
 {'pedestrians','ped-crossing','children','scholar-patrol','officer-ahead'},{'yield-ped','ped-priority','ped-only'},{'uneven','speed-humps'},{'goods-only','delivery-only'},{'no-goods','no-overtaking-goods'},{'keep-left','proceed-left'},{'keep-right','turn-right'},{'emergency-light','collision'},{'no-parking','no-stopping'},{'cycle-only','cycle-ped-split','ped-only'},{'roundabout','traffic-circle','yield-circle'},
 {'signals-ahead','signals-out','coordinated-signals','multi-phase'},{'no-cycles','no-cycles-peds','no-peds'},{'cattle','wild-animals','horse-riders','elephant'},
 {'reduced-visibility','headlamps-on','tunnel'},{'slow-heavy','truck-crossing','agri-vehicles'},{'mass-only','mass-limit'},{'no-overtaking','no-overtaking-goods'},
 {'road-works','grader'},{'bus-only','bus-stop','bus-stop-ahead','minibus-only','tour-only'},{'two-way','two-way-crossroad','yield-oncoming'},
 {'narrows-both','one-vehicle-width','narrow-bridge'},{'gravel-begins','uneven'},{'oneway-left','oneway-ahead','no-entry'}]
def related(a,b):
    return any(a in f and b in f for f in fam)
groupmap={'control':'reg','command':'reg','prohibition':'reg','reservation':'reg','comprehensive':'reg','selective':'reg','warning':'warn','information':'info'}
rnd=random.Random(53)
keys=list(signs)
auto=[]
for k in keys:
    s=signs[k]; g=groupmap[s['group']]
    # catch-all warning meanings would be true of any warning sign, so never use them as distractors
    pool=[x for x in keys if x!=k and not related(k,x) and groupmap[signs[x]['group']]==g and x not in ('general-warning','emergency-light')]
    if g=='info': pool=[x for x in keys if x!=k and not related(k,x) and groupmap[signs[x]['group']] in ('info','reg')]
    # prefer same exact group
    same=[x for x in pool if signs[x]['group']==s['group']]
    cand=same if len(same)>=4 else pool
    d=rnd.sample(cand,2)
    auto.append({'section':'signs','topic':'Sign meanings','img':k,'q':'What does this sign mean?','auto':1,
        'opts':[{'t':s['meaning'],'c':1}]+[{'t':signs[x]['meaning'],'c':0} for x in d],
        'exp':f"This is: {s['name']} ({s['code']}). {s['meaning']}",'src':f"Road Traffic Signs manual ({s['code']})"})
    d=rnd.sample(cand,2)
    auto.append({'section':'signs','topic':'Recognise the sign','q':f"Which sign means: {s['name']}?",'auto':1,
        'opts':[{'t':'img:'+k,'c':1}]+[{'t':'img:'+x,'c':0} for x in d],
        'exp':f"{s['name']} ({s['code']}): {s['meaning']}",'src':f"Road Traffic Signs manual ({s['code']})"})
qs+=auto
# ids
from hashlib import md5
seen=set()
for q in qs:
    h=md5((q['section']+q['q']+q.get('img','')+'|'.join(o['t'] for o in q['opts'] if o['c'])).encode()).hexdigest()[:8]
    assert h not in seen, q['q']; seen.add(h); q['id']=h
os.makedirs(f'{S}/src/data',exist_ok=True)
json.dump(qs,open(f'{S}/src/data/questions.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump(signs,open(f'{S}/src/data/signs.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump(qs,open(f'{S}/source/questions_full.json','w'),indent=1,ensure_ascii=False)
from collections import Counter
print(len(qs), Counter(q['section'] for q in qs), Counter((q['section'],q.get('auto',0)) for q in qs))
