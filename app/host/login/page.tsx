import {HostLoginForm} from '@/components/host/HostLoginForm';

export default async function HostLoginPage({searchParams}:{searchParams:Promise<{next?:string}>}){
  const{next}=await searchParams;
  return <main className="page"><div className="container section"><HostLoginForm nextPath={next}/></div></main>;
}
