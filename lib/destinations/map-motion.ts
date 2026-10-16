/** Camera easing and fitting shared by the SVG fly-in and its deterministic tests. */
export const PROVINCE_FLIGHT_MS=720;
export function cameraFrame(from:number[],to:number[],progress:number){
 const t=Math.max(0,Math.min(1,progress)),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 return from.map((v,i)=>v+(to[i]-v)*ease);
}
export function provinceCamera(bounds:number[],viewport:number[]){
 const w=Math.max(8,bounds[2]-bounds[0])*1.32,h=Math.max(8,bounds[3]-bounds[1])*1.32;
 const ratio=viewport[2]/viewport[3],width=Math.max(w,h*ratio),height=width/ratio;
 return [(bounds[0]+bounds[2]-width)/2,(bounds[1]+bounds[3]-height)/2,width,height];
}
