import Image from 'next/image';

type Props={size?:number;variant?:'app'|'light'};
export function Logo({size=48,variant='app'}:Props){return <Image src={variant==='light'?'/brand/geppao-mark-light.svg':'/brand/geppao-icon.svg'} width={size} height={size} alt="GepPao"/>}
