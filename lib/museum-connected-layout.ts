export type WebNode={id:string;name:string;region:string;regionIndex:number;w:number;h:number;x:number;y:number;vx:number;vy:number};
export function solveWebLayout(nodes: WebNode[], edges: {source:string;target:string}[], width:number, height:number) {
  const groups=[...new Set(nodes.map(n=>n.region))];
  nodes.forEach((n,i)=>{
    const g=groups.indexOf(n.region), siblings=nodes.filter(m=>m.region===n.region),j=siblings.indexOf(n);
    const angle=g/groups.length*Math.PI*2-Math.PI/2, inner=j/siblings.length*Math.PI*2;
    n.x=width/2+Math.cos(angle)*width*.28+Math.cos(inner)*45;
    n.y=height/2+Math.sin(angle)*height*.30+Math.sin(inner)*55;
    n.vx=0;n.vy=0;
  });
  const byName=new Map(nodes.map(n=>[n.name,n]));
  const links=edges.map(e=>[byName.get(e.source)!,byName.get(e.target)!]);
  function clamp(n:WebNode){n.x=Math.max(n.w/2+8,Math.min(width-n.w/2-8,n.x));n.y=Math.max(n.h/2+8,Math.min(height-n.h/2-8,n.y));}
  function separate(padding:number){
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y;
      const ox=(a.w+b.w)/2+padding-Math.abs(dx),oy=(a.h+b.h)/2+padding-Math.abs(dy);
      if(ox>0&&oy>0){if(ox<oy){const push=(ox+.1)/2*(dx>=0?1:-1);a.x-=push;b.x+=push;}else{const push=(oy+.1)/2*(dy>=0?1:-1);a.y-=push;b.y+=push;}clamp(a);clamp(b);}
    }
  }
  for(let t=0;t<950;t++){
    const cooling=1-t/1100,centres=new Map(groups.map(g=>{const ns=nodes.filter(n=>n.region===g);return[g,{x:ns.reduce((s,n)=>s+n.x,0)/ns.length,y:ns.reduce((s,n)=>s+n.y,0)/ns.length}]}));
    nodes.forEach(n=>{const c=centres.get(n.region)!;n.vx+=(c.x-n.x)*.003+(width/2-n.x)*.0007;n.vy+=(c.y-n.y)*.003+(height/2-n.y)*.0007;});
    for(const [a,b] of links){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,target=(a.w+b.w)/2+65,f=(d-target)*.006;const fx=dx/d*f,fy=dy/d*f;a.vx+=fx;a.vy+=fy;b.vx-=fx;b.vy-=fy;}
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,d2=Math.max(100,dx*dx+dy*dy),f=1250/d2;a.vx-=dx*f*.045;a.vy-=dy*f*.045;b.vx+=dx*f*.045;b.vy+=dy*f*.045;}
    nodes.forEach(n=>{n.vx*=.65;n.vy*=.65;n.x+=n.vx*cooling;n.y+=n.vy*cooling;clamp(n)});
    separate(15);
  }
  for(let t=0;t<600;t++)separate(12);
  return nodes;
}
