import {permanentRedirect} from 'next/navigation';
type Props={searchParams:Promise<{lang?:string|string[]}>};
/** The province explorer is now the homepage. Keep old bookmarks working. */
export default async function GoPage({searchParams}:Props){
 const {lang}=await searchParams;
 permanentRedirect(lang==='en'||lang==='th'?`/?lang=${lang}`:'/');
}
