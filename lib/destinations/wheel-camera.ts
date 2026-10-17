export type Camera=[number,number,number,number];
export function zoomCamera(base:Camera,current:Camera,factor:number,anchor:[number,number],maxZoom=4):Camera {
 if(!Number.isFinite(factor)||factor<=0||![...base,...current,...anchor].every(Number.isFinite)||base[2]<=0||base[3]<=0||current[2]<=0)return current;
 const width=Math.min(base[2],Math.max(base[2]/maxZoom,current[2]*factor)),ratio=width/current[2],height=base[3]*width/base[2];
 const x=anchor[0]-(anchor[0]-current[0])*ratio,y=anchor[1]-(anchor[1]-current[1])*ratio;
 return [Math.max(base[0],Math.min(base[0]+base[2]-width,x)),Math.max(base[1],Math.min(base[1]+base[3]-height,y)),width,height];
}
export function wheelFactor(delta:number,mode:number,pageHeight=540){
 const pixels=delta*(mode===1?16:mode===2?pageHeight:1);return Math.exp(Math.max(-240,Math.min(240,pixels))*.0025);
}
