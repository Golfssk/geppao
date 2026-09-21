import Image from 'next/image';

export function Brand(){return <span className="geppaoWordmark"><Image src="/brand/geppao-wordmark.svg" width={720} height={209} sizes="(max-width: 479px) 112px, 132px" priority alt="GepPao"/></span>}
