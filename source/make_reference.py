import json,fitz
from pathlib import Path
from PIL import Image,ImageOps
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
R=Path(__file__).parent;D=R/'dist';data=json.loads((R/'wheel-data.json').read_text());photos=json.loads((R/'photo-data.json').read_text())
for m in data:
 d=fitz.open(str(D/'assets'/f"{m['id']}.svg"));d[0].get_pixmap(matrix=fitz.Matrix(2,2)).save(str(D/'assets'/f"{m['id']}.png"))
for k,p in photos.items():
 src=D/'assets/photos'/p['file'];im=Image.open(src)
 if im.getexif().get(274,1)!=1:
  dest=src.with_name(src.stem+'-upright.jpg');ImageOps.exif_transpose(im).convert('RGB').save(dest,quality=94);p['printfile']=dest.name
pdfmetrics.registerFont(TTFont('Body','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'));pdfmetrics.registerFont(TTFont('Bold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
c=canvas.Canvas(str(D/'wheel-pack.pdf'),pagesize=(595,842));c.setTitle('The Wheel Deal - photo and diagram edition');n=0
navy='#242b34';teal='#287f70';orange='#e7a33d'
def txt(s,x,y,w=495,size=11,color=navy,bold=False):
 p=Paragraph(s,ParagraphStyle('p',fontName='Bold' if bold else 'Body',fontSize=size,leading=size*1.4,textColor=HexColor(color)));_,h=p.wrap(w,740);p.drawOn(c,x,y-h);return y-h

icons=Image.open(D/'assets/workshop-icons.png').convert('RGBA')
iw,ih=icons.size
def icon(i,x,y,size=60):
 im=icons.crop((i%4*iw//4,i//4*ih//3,(i%4+1)*iw//4,(i//4+1)*ih//3))
 c.drawImage(ImageReader(im),x,y,size,size,mask='auto',preserveAspectRatio=True)
def panel(x,y,w,h,fill):
 c.setFillColor(HexColor('#ded9c9'));c.roundRect(x+3,y-4,w,h,12,fill=1,stroke=0)
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(navy));c.setLineWidth(1.5);c.roundRect(x,y,w,h,12,fill=1,stroke=1)
def base(k,t):
 global n
 n+=1
 c.setFillColor(HexColor('#fffdf5'));c.rect(0,0,595,842,fill=1,stroke=0)
 c.setStrokeColor(HexColor(orange));c.setLineWidth(8);c.rect(14,14,567,814)
 c.setStrokeColor(HexColor(navy));c.setLineWidth(.7);c.rect(22,22,551,798)
 c.drawImage(str(D/'assets/ga6-logo.png'),475,777,72,30,preserveAspectRatio=True,mask='auto')
 txt('GIRAFFE ACADEMY / WRITING PROJECT 03',42,803,size=9,bold=True,color=teal)
 c.setFillColor(HexColor('#f5db87'));c.roundRect(38,756,408,25,5,fill=1,stroke=0)
 txt(k.upper(),47,775,395,size=9,bold=True)
 txt(t,42,747,448,size=20 if len(t)>24 else 27,bold=True)
 icon(1 if n%2 else 5,500,703,54)
 c.setStrokeColor(HexColor(teal));c.setLineWidth(2);c.line(42,704,485,706)
 txt('THE WHEEL DEAL / COMIC EXPLORER EDITION',42,43,size=8,color=teal)
 c.setFillColor(HexColor('#f5db87'));c.circle(541,39,12,fill=1,stroke=0);txt(str(n),534,45,22,9,bold=True)
def image(path,x,y,w,h):c.drawImage(str(path),x,y,width=w,height=h,preserveAspectRatio=True,anchor='c',mask='auto')
def photo(k,x,y,w,h):
 p=photos[k]
 panel(x-3,y-3,w+6,h+6,'#ffffff')
 image(D/'assets/photos'/p.get('printfile',p['file']),x+5,y+5,w-10,h-10)
 c.saveState();c.setFillColor(HexColor('#f2d78c'))
 c.translate(x+9,y+h-6);c.rotate(9);c.rect(-10,-4,43,12,fill=1,stroke=0);c.restoreState()
def end():c.showPage()
base('Your illustrated machine encyclopedia','THE WHEEL DEAL')
txt('Real machines. Clear diagrams.<br/>Big ideas for your own writing.',42,693,size=21,color=teal,bold=True)
icon(5,458,618,80)
photo('bicycle',40,345,510,270);photo('sharpener',65,170,170,165);photo('winch',300,170,230,165)
txt('Find the parts. Follow the movement.<br/>Explain what happens - and why.',42,135,size=14,bold=True)
for i in range(55):
 c.setFillColor(HexColor(navy));c.rect(397+i*2.5,70,1+(i%3==0),35+(i%4)*2,fill=1,stroke=0)
txt('CLASSROOM EDITION',397,65,150,7);end()
base('Start exploring','What will you explain?')
for i,m in enumerate(data):
 y=685-i*65;txt(m['name'],48,y,350,18,bold=True);txt(m['tag'],48,y-27,350,11,color=teal);txt(str(3+2*i)+'–'+str(4+2*i),475,y,70,17,bold=True)
icon(0,445,93,90);txt('HOW TO USE THIS BOOK',48,203,size=13,bold=True,color=teal);txt('1. Look at the photograph.<br/>2. Match the parts in the diagram.<br/>3. Follow the steps and discuss the cause and effect.<br/>4. Record keywords. Explain the process in your own words.',48,174,w=380,size=12);end()
for m in data:
 k=m['id'];p=photos[k];base('Meet the real machine',m['name']);txt(m['tag']+' • Energy source: '+m['power'],42,692,size=12,color=teal,bold=True);photo(k,45,335,505,330);txt(p['caption'],48,321,size=11)
 panel(40,132,510,145,'#e3edda');icon(2,461,213,75)
 y=263;txt('DID YOU KNOW?',56,y,395,size=14,bold=True,color=teal);y-=28
 for fact in m['facts']:y=txt('• '+fact,56,y,w=398,size=11)-12
 icon(1,44,62,47);txt('LOOK CLOSELY',103,111,440,size=11,bold=True,color=teal);txt('Which parts can you see? Which parts might be hidden inside?',103,91,432,size=10);end()
 base('A clear model • not to scale',m['name']+' explained');image(D/'assets'/f'{k}.png',38,375,520,320);txt('Simplified model. Designs vary; hidden parts may be shown.',45,369,size=9,color=teal)
 y=343
 for i,step in enumerate(m['steps']):
  c.setFillColor(HexColor('#f5db87'));c.circle(55,y-10,10,fill=1,stroke=0);txt(str(i+1),51,y-3,15,9,bold=True)
  y=txt(step,76,y,w=466,size=11)-10
 y-=2;txt('<b>CAUSE:</b> '+m['cause']+'<br/><b>EFFECT:</b> '+m['effect'],45,y,size=11,color=teal)
 icon(2,43,59,48);txt('TALK ABOUT IT: '+m['question'],104,91,435,size=10,bold=True);end()
base('Beyond the main example','Same parts, new jobs')
photo('winch',42,468,240,220);txt('DRUM + CABLE',310,670,235,16,bold=True,color=teal);txt('A winch winds cable onto a drum. You can also find cable drums in some cranes. The turning drum takes in cable to pull or lift a load.',310,633,235,12)
photo('pottery-machine',42,205,240,210);txt('WHEEL HEAD + MOTOR',310,409,235,16,bold=True,color=teal);txt('Here is a pottery wheel without clay. Find the round wheel head. The larger pan around it catches splashes; the pan does not need to turn.',310,372,235,12)
icon(1,458,77,75);txt('MACHINE DETECTIVE',48,155,size=13,bold=True,color=teal);txt('Where else have you seen a wheel, gear, chain, belt or pulley? Explain what the part does in that machine.',48,127,w=390,size=12);end()
base('Words that explain','Your writing toolbox')
v=json.loads((R/'vocab-data.json').read_text());y=690
for cat in ['Parts','Actions','Linking']:
 c.setFillColor(HexColor('#f5db87'));c.roundRect(42,y-24,495,28,5,fill=1,stroke=0)
 y=txt(cat.upper(),52,y,size=14,bold=True,color=teal)-15
 for a,b in v[cat]:y=txt('<b>'+a+'</b> — '+b,45,y,size=10)-8
 y-=12
end()
base('Research first • write your own text','Collect ideas, not an essay')
y=685
for t in ['My chosen machine and its purpose','Its energy source and important parts','My keywords: first / then / finally','A cause and its effect','My diagram: parts to label']:
 txt(t,45,y,size=14,bold=True,color=teal)
 c.setStrokeColor(HexColor('#bdc8c0'));c.setLineWidth(.7)
 for j in range(3):c.line(45,y-40-j*23,548,y-40-j*23)
 y-=115
end()
base('Photo credits and further reading','Sources & acknowledgements')
y=690
for k,p in photos.items():
 u=p['source'];name=u.split('File:')[-1];y=txt(f'<b>{k}:</b> {p["credit"]} · {p["license"]}<br/><link href="{u}" color="{teal}">{name}</link>',44,y,size=8)-10
links={'CC BY-SA 3.0':'https://creativecommons.org/licenses/by-sa/3.0/','CC BY 2.5':'https://creativecommons.org/licenses/by/2.5/','CC BY 4.0':'https://creativecommons.org/licenses/by/4.0/','CC BY-SA 4.0':'https://creativecommons.org/licenses/by-sa/4.0/','CC0':'https://creativecommons.org/publicdomain/zero/1.0/'}
y=txt('Photo links lead to the original files and licence details. Photographs are fitted without cropping; one is rotated to its upright orientation. Attribution and ShareAlike terms remain applicable.',44,y,size=8)-12
for a,u in links.items():y=txt(f'<link href="{u}" color="{teal}">{a}: {u}</link>',44,y,size=7)-4
y-=10
for m in data:y=txt(f'<b>{m["name"]}:</b> <link href="{m["source"]}" color="{teal}">Read the supporting source</link>',44,y,size=8)-5
txt('Original educational schematics: Giraffe Academy classroom resource. Use them to explain mechanisms, not as construction plans.',44,85,size=8);end();c.save();print('Pages:',n)
