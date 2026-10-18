// Client invalidation state, never an authorization credential.
export function createDraftScope(ownerId:string|null){
 let available=true,closed=false,revision=0;
 return {ownerId,
  capture(){return available&&!closed?revision:null},
  accepts(token:number|null){return token!==null&&available&&!closed&&token===revision},
  setAvailable(value:boolean){if(value!==available){available=value;revision++}},
  close(){closed=true;available=false;revision++},
 };
}
export type DraftScope=ReturnType<typeof createDraftScope>;
