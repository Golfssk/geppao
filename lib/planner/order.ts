// Sparse integer ranks allow a single scoped update without a non-atomic swap.
export function moveRank(items:Array<{position:number}>,index:number,direction:-1|1):number|null {
 const target=index+direction;if(target<0||target>=items.length)return null;
 const left=direction===-1?items[target-1]?.position:items[target]?.position;
 const right=direction===-1?items[target]?.position:items[target+1]?.position;
 const rank=left===undefined?Number(right)-1024:right===undefined?left+1024:Math.floor((left+right)/2);
 return Number.isSafeInteger(rank)&&rank>=-2147483648&&rank<=2147483647&&(left===undefined||rank>left)&&(right===undefined||rank<right)?rank:null;
}
