import os
D=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'img','marks')
W,H=240,240
# Edge lines: SA uses a yellow line on the left edge of each direction of travel (RM4.1).
# Two-way road: both edges are a "left edge" for one direction. One-way (oneway=True): right edge is white.
def road(inner,extra_defs='',oneway=False,left_edge=True):
    le=f'<rect x="44" y="0" width="3" height="{H}" fill="#fbc02d"/>' if left_edge else ''
    re=f'<rect x="193" y="0" width="3" height="{H}" fill="{"#fff" if oneway else "#fbc02d"}"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{extra_defs}
<rect width="{W}" height="{H}" fill="#7cae5a"/><rect x="40" y="0" width="160" height="{H}" fill="#5f6368"/>
{le}{re}
{inner}</svg>'''
def car(x,y,rot=0,col='#1e88e5'):
    return f'<g transform="translate({x} {y}) rotate({rot})"><rect x="-11" y="-20" width="22" height="40" rx="5" fill="{col}"/><rect x="-8" y="-12" width="16" height="9" rx="2" fill="#cfe8ff"/></g>'
def dashes(x,col='#fff',w=4,dash=22,gap=18,off=0):
    s='';y=-off
    while y<H: s+=f'<rect x="{x-w/2}" y="{y}" width="{w}" height="{dash}" fill="{col}"/>'; y+=dash+gap
    return s
files={}
# single solid centre line (no overtaking) RM1
files['m-no-overtaking']=road('<rect x="118" y="0" width="5" height="240" fill="#fff"/>'+car(80,170,0)+car(160,60,180,'#e53935'))
# no crossing double line RM2
files['m-no-crossing']=road('<rect x="112" y="0" width="5" height="240" fill="#fff"/><rect x="123" y="0" width="5" height="240" fill="#fff"/>'+car(80,170)+car(160,60,180,'#e53935'))
# broken dividing line WM3 (two-way)
files['m-dividing']=road(dashes(120)+car(80,170)+car(160,60,180,'#e53935'))
# combination: broken line on driver side, solid on other (from driver's lane on left: line nearest to driver is broken)
files['m-solid-broken']=road(dashes(114)+'<rect x="122" y="0" width="5" height="240" fill="#fff"/>'+car(80,170)+car(160,60,180,'#e53935'))
files['m-broken-solid']=road('<rect x="111" y="0" width="5" height="240" fill="#fff"/>'+dashes(125)+car(80,170)+car(160,60,180,'#e53935'))
# lane lines GM1 one-way, both same direction
files['m-lane-lines']=road(dashes(120,dash=12,gap=28)+car(80,170)+car(160,110,0,'#43a047'),oneway=True)
# stop line RTM1 with STOP
files['m-stop-line']=road('<rect x="47" y="70" width="71" height="10" fill="#fff"/><rect x="118" y="0" width="4" height="240" fill="#fff"/><rect x="60" y="100" width="1" height="1" fill="none"/><text x="83" y="130" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="24" fill="#fff">STOP</text>'+car(85,195))
# yield line RTM2 (broken transverse line) + triangle
tri='<polygon points="60,110 110,110 85,160" fill="none" stroke="#fff" stroke-width="7"/>'
yl=''.join(f'<rect x="{x}" y="70" width="12" height="8" fill="#fff"/>' for x in range(50,112,20))+dashes(120)
files['m-yield-line']=road(yl+tri+car(85,205))
# yield control ahead WM5: triangle only far before
files['m-yield-ahead']=road('<polygon points="58,60 112,60 85,140" fill="none" stroke="#fff" stroke-width="7"/>'+dashes(120)+car(85,205))
# red no-stopping line RM12 along left edge
files['m-no-stopping']=road('<rect x="44" y="0" width="6" height="240" fill="#d32f2f"/>'+dashes(120)+car(75,120,0,'#555'),left_edge=False)
# yellow no-parking line RM13
files['m-no-parking']=road('<rect x="44" y="0" width="6" height="240" fill="#fbc02d"/>'+dashes(120)+car(75,120,0,'#555'),left_edge=False)
# box junction RM10 yellow cross-hatch
bx='<rect x="0" y="80" width="240" height="80" fill="#5f6368"/><rect x="60" y="88" width="120" height="64" fill="none" stroke="#fbc02d" stroke-width="4"/>'+''.join(f'<line x1="{60+i*24}" y1="88" x2="{60+i*24+64}" y2="152" stroke="#fbc02d" stroke-width="3"/><line x1="{60+i*24+64}" y1="88" x2="{60+i*24}" y2="152" stroke="#fbc02d" stroke-width="3"/>' for i in range(-2,5))
files['m-box-junction']=road(bx.replace('<line','<line clip-path="url(#c)"'),'<defs><clipPath id="c"><rect x="60" y="88" width="120" height="64"/></clipPath></defs>')
# painted island RM5 – yellow diagonal hatching between lines
pi='<rect x="105" y="20" width="30" height="200" fill="none" stroke="#fbc02d" stroke-width="3"/>'+''.join(f'<line x1="105" y1="{30+i*22}" x2="135" y2="{50+i*22}" stroke="#fbc02d" stroke-width="5" clip-path="url(#p)"/>' for i in range(9))
files['m-painted-island']=road(pi,'<defs><clipPath id="p"><rect x="105" y="20" width="30" height="200"/></clipPath></defs>')
# pedestrian crossing block RTM4 (zebra)
z=''.join(f'<rect x="{x}" y="90" width="12" height="60" fill="#fff"/>' for x in range(52,192,22))
files['m-ped-crossing']=road(z+''.join(f'<rect x="{x}" y="180" width="10" height="5" fill="#fff"/>' for x in range(50,112,18))+'<rect x="118" y="150" width="4" height="90" fill="#fff"/><rect x="118" y="0" width="4" height="90" fill="#fff"/>'+car(85,215))
# continuity lines WM2: short dashes short gaps at edge of lane near off-ramp
files['m-continuity']=road(dashes(120,dash=10,gap=8)+car(80,170)+car(160,120,0,'#43a047'))
# bus lane marking with BUS word
arr=lambda x,y: f'<path d="M{x} {y+30} V{y} M{x-9} {y+10} L{x} {y} L{x+9} {y+10}" stroke="#fff" stroke-width="4" fill="none"/>'
files['m-bus-lane']=road(dashes(120,'#fbc02d',w=5,dash=12,gap=8)+arr(80,40)+arr(160,180)+'<text x="160" y="140" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="26" fill="#fbc02d" transform="rotate(-90 160 130)">BUS</text>'+car(80,170),oneway=True)
# traffic lights
def light(on, flash=False, arrow=None):
    cols={'r':'#e53935','a':'#ffb300','g':'#43a047'}
    s=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 240" width="120" height="240"><rect width="120" height="240" fill="#eef1f4"/><rect x="25" y="10" width="70" height="200" rx="14" fill="#212121"/><rect x="55" y="210" width="10" height="30" fill="#616161"/>'
    for i,c in enumerate('rag'):
        cy=45+i*65; fill=cols[c] if c==on else '#3a3a3a'
        anim='<animate attributeName="opacity" values="1;1;0.08;0.08" dur="1s" repeatCount="indefinite"/>' if (flash and c==on) else ''
        if arrow and c==on:
            s+=f'<circle cx="60" cy="{cy}" r="25" fill="#111"/>'
            path={'left':f'M78 {cy} H50 M58 {cy-12} L44 {cy} L58 {cy+12}','right':f'M42 {cy} H70 M62 {cy-12} L76 {cy} L62 {cy+12}'}[arrow]
            s+=f'<path d="{path}" stroke="{fill}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round">{anim.replace("opacity","stroke-opacity")}</path>'
        else:
            s+=f'<circle cx="60" cy="{cy}" r="25" fill="{fill}">{anim}</circle>'
    return s+'</svg>'
files['t-red']=light('r'); files['t-amber']=light('a'); files['t-green']=light('g')
files['t-flash-red']=light('r',True); files['t-flash-amber']=light('a',True)
files['t-flash-green-right']=light('g',True,'right'); files['t-flash-red-left']=light('r',True,'left')
files['t-amber-arrow-right']=light('a',False,'right'); files['t-green-arrow-left']=light('g',False,'left')
for k,v in files.items(): open(f'{D}/{k}.svg','w').write(v)
print(len(files))
