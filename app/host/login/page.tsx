import {HostLoginForm} from '@/components/host/HostLoginForm';

export default async function HostLoginPage({searchParams}:{searchParams:Promise<{next?:string;error?:string}>}){
  const{next,error}=await searchParams;
  return <main className="page"><div className="container section"><HostLoginForm nextPath={next} oauthError={error==='oauth'}/></div></main>;
}
