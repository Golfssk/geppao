import json,math,pathlib,re,difflib,collections
import argparse
parser=argparse.ArgumentParser(description='Derive per-province district maps and selected OSM points from attributed source snapshots.')
for name in ['adm1','adm2','names-provinces','names-districts','osm']:parser.add_argument('--'+name,required=True)
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]; out=root/'public/maps/provinces';out.mkdir(exist_ok=True)
adm1=json.load(open(args.adm1))['features'];adm2=json.load(open(args.adm2))['features']
content=json.load(open(root/'lib/destinations/provinces.json'))
byname={p['nameEn']:p['id'] for p in content}
def polygons(g):return g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
def area(p):return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p,p[1:]))/2
def inside(p,ring):
 x,y=p;f=False
 for a,b in zip(ring,ring[1:]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:f=not f
 return f
def within(p,polys):return any(inside(p,v[0]) and not any(inside(p,h) for h in v[1:]) for v in polys)
def bounds(polys):
 pts=[v for poly in polys for ring in poly for v in ring];return [min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)]
def center(polys):
 ring=max((v[0] for v in polys),key=lambda r:abs(area(r)));A=area(ring)
 x=sum((a[0]+b[0])*(a[0]*b[1]-b[0]*a[1]) for a,b in zip(ring,ring[1:]))/(6*A);y=sum((a[1]+b[1])*(a[0]*b[1]-b[0]*a[1]) for a,b in zip(ring,ring[1:]))/(6*A)
 if within((x,y),polys):return x,y
 b=bounds([ [ring] ]);pts=[(b[0]+(b[2]-b[0])*i/24,b[1]+(b[3]-b[1])*j/24) for i in range(1,24) for j in range(1,24)];return min((p for p in pts if within(p,polys)),key=lambda p:(p[0]-x)**2+(p[1]-y)**2)
def simplify(ps,t=.002):
 if len(ps)<3:return ps
 a,b=ps[0],ps[-1];dx,dy=b[0]-a[0],b[1]-a[1];den=dx*dx+dy*dy
 def dist(p):
  u=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
  return math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy)
 ds=[dist(p) for p in ps[1:-1]];m=max(ds,default=0)
 if m<=t:return [a,b]
 k=ds.index(m)+1;return simplify(ps[:k+1],t)[:-1]+simplify(ps[k:],t)
def merc(p):return ((p[0]+180)/360,(1-math.asinh(math.tan(math.radians(p[1])))/math.pi)/2)
provs=[]
for f in adm1:
 ps=polygons(f['geometry']);n=f['properties']['shapeName'].replace(' Province','');provs.append({'id':byname[n],'polys':ps,'bounds':bounds(ps),'center':center(ps)})
def locate(pt):
 cand=[p for p in provs if p['bounds'][0]<=pt[0]<=p['bounds'][2] and p['bounds'][1]<=pt[1]<=p['bounds'][3]]
 return next((p for p in cand if within(pt,p['polys'])),None)
namesp=json.load(open(args.names_provinces));namesd=json.load(open(args.names_districts))
def norm(s):return re.sub('[^a-z]','',s.lower()).replace('amphoe','').replace('mueang','muang')
np={norm(p['name']['en']):p['id'] for p in namesp};nd=collections.defaultdict(list)
for d in namesd:
 if not d.get('deleted_at'):nd[d['province_id']].append(d)
groups=collections.defaultdict(list);unmatched=[]
# Upstream name table has a few English spelling/translation mistakes. Explicit,
# auditable aliases below map to Thai names, not invented geometry.
nameAliases={'Thong Pha Phum':'ทองผาภูมิ','Vadhana':'วัฒนา','Tha Tako':'ท่าตะโก','Lat Yao':'ลาดยาว','Takhli':'ตาคลี','Phayuha Khiri':'พยุหะคีรี','Noen Sa-Nga':'เนินสง่า'}
for f in adm2:
 ps=polygons(f['geometry']);pt=center(ps);geoParent=locate(pt);name=f['properties']['shapeName']
 exact=[d for d in namesd if (d['name']['th']==nameAliases[name] if name in nameAliases else norm(d['name']['en'])==norm(name))]
 if len(exact)>1 and geoParent:
  pn=next(c['nameEn'] for c in content if c['id']==geoParent['id']);exact=[d for d in exact if d['province_id']==np.get(norm(pn))]
 matched=exact[0] if len(exact)==1 else None
 if not matched and geoParent:
  pn=next(c['nameEn'] for c in content if c['id']==geoParent['id']);candidates=nd[np.get(norm(pn))]
  scores=sorted(((difflib.SequenceMatcher(None,norm(name),norm(d['name']['en'])).ratio(),d) for d in candidates),key=lambda x:x[0],reverse=True)
  if scores and scores[0][0]>=.86:matched=scores[0][1]
 if matched:
  apiProvince=next(q for q in namesp if q['id']==matched['province_id']);c=next(c for c in content if c['name']==apiProvince['name']['th'] or norm(c['nameEn'])==norm(apiProvince['name']['en']));p=next(q for q in provs if q['id']==c['id'])
 else:
  p=geoParent;unmatched.append((p['id'] if p else None,name))
 if not p:raise ValueError(('District parent unresolved',name,pt))
 groups[p['id']].append({'id':f['properties']['shapeID'],'name':matched['name']['th'] if matched else name,'nameEn':name,'polys':ps,'center':pt})
districtAreas=[{'province':pid,'polys':d['polys'],'bounds':bounds(d['polys'])} for pid,ds in groups.items() for d in ds]
def poiProvince(pt):
 for d in districtAreas:
  b=d['bounds']
  if b[0]<=pt[0]<=b[2] and b[1]<=pt[1]<=b[3] and within(pt,d['polys']):return next(p for p in provs if p['id']==d['province'])
 return None
poiPath=args.osm
poiData=json.load(open(poiPath));poiGroups=collections.defaultdict(list)
for e in poiData['elements']:
 t=e.get('tags',{});c=e.get('center',e)
 if 'lat' not in c:continue
 pt=(c['lon'],c['lat']);p=poiProvince(pt)
 if not p:continue
 name=t.get('name:th',t.get('name',''));nameEn=t.get('name:en',t.get('int_name',name));kind='waterfall' if t.get('waterway')=='waterfall' else 'dam' if t.get('waterway')=='dam' else 'visitor' if t.get('information')=='visitor_centre' else t.get('tourism','park')
 score=10*bool(t.get('wikidata'))+5*bool(t.get('wikipedia'))+3*(kind in ['waterfall','dam','visitor'])
 if any(word in name for word in ['ขุนด่าน','เอราวัณ','เขาใหญ่']):score+=200 if kind in ['waterfall','dam','visitor'] else 100
 poiGroups[p['id']].append({'id':str(e['type'])+'/'+str(e['id']),'name':name.split(';')[0],'nameEn':nameEn.split(';')[0],'kind':kind,'lon':pt[0],'lat':pt[1],'coordinateType':'node' if e['type']=='node' else 'area-center','source':'https://www.openstreetmap.org/'+str(e['type'])+'/'+str(e['id']),'score':score})
curated=json.load(open(root/'lib/destinations/curated-places.json'))
index=[]
for p in provs:
 ds=groups[p['id']];allps=[poly for d in ds for poly in d['polys']];b=bounds(allps);a=merc((b[0],b[3]));z=merc((b[2],b[1]));unit=max(z[0]-a[0],z[1]-a[1])/1000
 def proj(pt):
  v=merc(pt);return [round((v[0]-a[0])/unit,2),round((v[1]-a[1])/unit,2)]
 def path(ps):
  parts=[]
  for poly in ps:
   for ring in poly:
    pts=[proj(pt) for pt in simplify(ring)]
    if len(pts)>=4:parts.append('M'+'L'.join(f'{v[0]},{v[1]}' for v in pts[:-1])+'Z')
  return ''.join(parts)
 districts=[{'id':d['id'],'name':d['name'],'nameEn':d['nameEn'],'d':path(d['polys']),**dict(zip(['x','y'],proj(d['center'])))} for d in ds]
 chosen=[];seen=set()
 for e in sorted(poiGroups[p['id']],key=lambda e:(-e['score'],e['id'])):
  if e['name'] in seen:continue
  seen.add(e['name']);e=dict(e);e.pop('score');e.update(dict(zip(['x','y'],proj((e['lon'],e['lat'])))));chosen.append(e)
  if len(chosen)==12:break
 # Editorial slots retain exact source coordinates, validated against district geometry.
 for override in curated.get(p['id'],[]):
  entry=dict(override['place']);pt=(entry['lon'],entry['lat'])
  if not within(pt,allps):raise ValueError(('Curated point outside province',p['id'],entry['id']))
  entry.update(dict(zip(['x','y'],proj(pt))))
  slot=override['slot']-1
  if slot<0 or slot>=len(chosen):raise ValueError(('Invalid curated slot',slot))
  chosen[slot]=entry
 vb=[-75,-75,round((z[0]-a[0])/unit+150,2),round((z[1]-a[1])/unit+200,2)]
 data={'id':p['id'],'sourceBoundaryId':'THA-ADM2-78962969','year':2019,'districtLicense':'CC-BY-3.0-IGO','placesLicense':'ODbL-1.0','projection':'WebMercator-normalized','origin':a,'unit':unit,'viewBox':vb,'districts':districts,'places':chosen,'osmSnapshot':poiData.get('osm3s',{}).get('timestamp_osm_base')}
 (out/(p['id']+'.json')).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');index.append({'id':p['id'],'districts':len(districts),'places':len(chosen)})
(root/'lib/destinations/province-index.json').write_text(json.dumps(sorted(index,key=lambda p:p['id']),ensure_ascii=False,indent=1)+'\n')
(out/'index.json').write_text(json.dumps({'districtSource':'THA-ADM2-78962969','year':2019,'districtLicense':'CC-BY-3.0-IGO','placesLicense':'ODbL-1.0','provinces':[{**p,'url':'/maps/provinces/'+p['id']+'.json'} for p in sorted(index,key=lambda p:p['id'])]},ensure_ascii=False,indent=1)+'\n')
print('Districts',sum(v['districts'] for v in index),'POIs',sum(v['places'] for v in index),'zero places',[p['id'] for p in index if not p['places']]);print('Unmatched Thai names',unmatched);print('Total JSON bytes',sum(f.stat().st_size for f in out.glob('*.json')))
