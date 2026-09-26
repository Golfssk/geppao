const MANAGED_BUCKET_PATHS=['/storage/v1/object/public/place-images/','/storage/v1/object/public/event-images/'];

export function isManagedPublicMediaUrl(value:string|null|undefined):value is string{
  if(!value)return false;
  try{
    const media=new URL(value);
    const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
    if(!projectUrl)return false;
    const project=new URL(projectUrl);
    return media.protocol==='https:'
      && media.origin===project.origin
      && MANAGED_BUCKET_PATHS.some(path=>media.pathname.startsWith(path));
  }catch{return false}
}

export function managedPublicMediaUrl(value:string|null|undefined){
  return isManagedPublicMediaUrl(value)?value:null;
}
