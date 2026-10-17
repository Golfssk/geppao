import {safeAuthNext} from './redirect';
let navigating=false;
// A new document discards Next's client router cache after an identity change.
// This is UI invalidation only; server getUser() and RLS remain authoritative.
export function hardAuthNavigate(path:string){
 if(navigating)return;
 navigating=true;
 window.dispatchEvent(new Event('geppao:auth-navigation'));
 try{window.location.replace(safeAuthNext(path))}catch(error){navigating=false;throw error}
}
