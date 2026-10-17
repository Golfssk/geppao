// One policy for password login, OAuth callback and the legacy /login alias.
// A redirect destination is navigation only, never an authorization decision.
const BASE='https://auth-destination.invalid';
const FALLBACK='/trips';
export function safeAuthNext(value:unknown):string{
 if(typeof value!=='string'||!value||value.length>2048)return FALLBACK;
 let decoded=value;
 try{
  // Reject browser backslash normalization, control characters and nested encoded
  // authority-like paths. Validation does not decode the returned query string.
  for(let i=0;i<4;i++){
   if(!decoded.startsWith('/')||decoded.startsWith('//')||/[\\\u0000-\u0020\u007f]/.test(decoded))return FALLBACK;
   const next=decodeURIComponent(decoded);if(next===decoded)break;
   decoded=next;if(i===3)return FALLBACK;
  }
  const url=new URL(value,BASE),normalized=new URL(decoded,BASE);
  if(url.origin!==BASE||normalized.origin!==BASE)return FALLBACK;
  for(const candidate of [url,normalized]){
   // /safe/..//host becomes //host after URL normalization. Returning that
   // pathname would turn a subsequent new URL(next,origin) into an external URL.
   if(candidate.pathname.startsWith('//'))return FALLBACK;
   const path=candidate.pathname.replace(/\/+$/,'')||'/';
   if(path==='/login'||path==='/host/login'||path==='/auth'||path.startsWith('/auth/'))return FALLBACK;
  }
  return url.pathname+url.search+url.hash;
 }catch{return FALLBACK}
}
