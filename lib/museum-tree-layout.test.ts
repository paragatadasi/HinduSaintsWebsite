import {test} from "node:test";
import assert from "node:assert/strict";
import {treeNeighborhood,connectedTreeGraph,treeColumnsForWidth,layoutMuseumTree,normalizeTreeClaims,treeNameLines,TREE_GEOMETRY,type TreePerson,type TreeClaim} from "./museum-tree-layout";
const nodes=(...ids:string[]):TreePerson[]=>ids.map(id=>({id,name:id,birthYear:null,samadhiYear:null}));
const edge=(from:string,to:string,kind:TreeClaim["kind"]="guru"):TreeClaim=>({id:from+to+kind,from,to,kind,status:"published",evidence:"certain",confidence:"high"});
test("reciprocal claims share a direction and preserve evidence",()=>{
 const raw=(id:string,fromSaintId:string,toSaintId:string,relationshipType:string)=>({id,fromSaintId,toSaintId,relationshipType,status:"published",evidenceStatus:"certain",confidence:"high"});
 const r=layoutMuseumTree(nodes("teacher","student"),normalizeTreeClaims([raw("1","student","teacher","guru"),raw("2","teacher","student","disciple")]));assert.equal(r.edges.length,1);assert.equal(r.edges[0].claims.length,2);assert.ok(r.nodes.find(n=>n.id==="teacher")!.row<r.nodes.find(n=>n.id==="student")!.row);
});
test("Guru Ma pairing does not flatten another disciple",()=>{
 const r=layoutMuseumTree(nodes("a","b","c"),[edge("a","b","partner"),edge("a","b"),edge("a","c")]);const row=(id:string)=>r.nodes.find(n=>n.id===id)!.row;assert.equal(row("a"),row("b"));assert.ok(row("c")>row("a"));assert.equal(r.edges.find(e=>e.kind==="guru"&&e.to==="b")!.secondary,"partner pair");
});
test("shortcut remains inspectable without flattening generations",()=>{const r=layoutMuseumTree(nodes("a","b","c"),[edge("a","b"),edge("b","c"),edge("a","c")]);assert.equal(r.nodes.find(n=>n.id==="c")!.row,2);assert.equal(r.edges.find(e=>e.from==="a"&&e.to==="c")!.secondary,"shortcut");assert.equal(r.edges.length,3);});
test("cycles terminate and retain all claims with explicit flag",()=>{const r=layoutMuseumTree(nodes("a","b","c"),[edge("a","b"),edge("b","c"),edge("c","a")]);assert.ok(r.edges.some(e=>e.secondary==="cycle"));assert.equal(r.edges.length,3);assert.ok(r.height<2000);});
test("partner constraints preserve an intervening disciple",()=>{const r=layoutMuseumTree(nodes("a","b","c"),[edge("a","b"),edge("b","c"),edge("a","c","partner")]);assert.ok(r.nodes.find(n=>n.id==="c")!.row>r.nodes.find(n=>n.id==="b")!.row);});
test("late root disciple aligns with terminal cohort",()=>{
 const people=nodes("a","b","c","d","late").map(n=>({...n,birthYear:n.id==="late"||n.id==="d"?1900:null,samadhiYear:n.id==="late"||n.id==="d"?1980:null}));const r=layoutMuseumTree(people,[edge("a","b"),edge("b","c"),edge("c","d"),edge("a","late")]);assert.equal(r.nodes.find(n=>n.id==="late")!.row,3);assert.equal(r.nodes.find(n=>n.id==="b")!.row,1);assert.match(r.edges.find(e=>e.to==="late")!.path,/ H /);
});
test("museum evidence and input order do not change geometry",()=>{
 const people=nodes("a","b","c","d"),edges=[edge("a","c"),edge("b","d"),edge("c","d","incarnation")];const a=layoutMuseumTree(people,edges),b=layoutMuseumTree([...people].reverse().map(n=>({...n,presence:"source" as const})),[...edges].reverse());assert.deepEqual(a.nodes.map(n=>[n.id,n.x,n.y]),b.nodes.map(n=>[n.id,n.x,n.y]));for(const n of a.nodes)for(const m of a.nodes)if(n.id!==m.id&&n.row===m.row)assert.ok(Math.abs(n.x-m.x)>=TREE_GEOMETRY.nodeWidth);
});
test("long unbroken names stay bounded",()=>{const lines=treeNameLines("A".repeat(200));assert.equal(lines.length,4);assert.ok(lines.every(l=>l.length<=30));assert.match(lines[3],/\u2026$/);});

test("compact peers wrap chronologically without flattening lineage or separating partners",()=>{
 const people=nodes("teacher","z","a","b","c","d","child").map(n=>({...n,birthYear:({z:1800,a:1810,b:1820,c:1830,d:1840} as Record<string,number>)[n.id]??null}));
 const claims=[...['z','a','b','c','d'].map(id=>edge('teacher',id)),edge('c','d','partner'),edge('a','child')];
 const compact=layoutMuseumTree(people,claims,{compact:true}),wide=layoutMuseumTree(people,claims);
 const byId=new Map(compact.nodes.map(n=>[n.id,n]));
 assert.ok(compact.width<wide.width);
 assert.ok(byId.get('z')!.x<byId.get('a')!.x);
 assert.equal(byId.get('c')!.y,byId.get('d')!.y);
 assert.ok(byId.get('child')!.y>Math.max(...['z','a','b','c','d'].map(id=>byId.get(id)!.y)));
 for(const n of compact.nodes)for(const m of compact.nodes)if(n.id!==m.id)assert.ok(Math.abs(n.x-m.x)>=TREE_GEOMETRY.nodeWidth||Math.abs(n.y-m.y)>=TREE_GEOMETRY.nodeHeight);
 assert.deepEqual(compact.nodes.map(n=>[n.id,n.x,n.y]),layoutMuseumTree([...people].reverse(),[...claims].reverse(),{compact:true}).nodes.map(n=>[n.id,n.x,n.y]));
});

test("only actual connected saints appear, and saint context stays in its component",()=>{
 const graph=layoutMuseumTree(nodes('a','b','c','d','alone'),[edge('a','b'),edge('c','d')]);
 assert.equal(connectedTreeGraph(graph).nodes.length,4);
 assert.deepEqual(connectedTreeGraph(graph,'a').nodes.map(n=>n.id),['a','b']);
 assert.equal(connectedTreeGraph(graph,'alone').edges.length,0);
 assert.equal(connectedTreeGraph(layoutMuseumTree(nodes('a','b'),[])).nodes.length,0);
});
test("compact columns fit a desktop card and tighten unused horizontal spacing",()=>{
 const width=1050, columns=treeColumnsForWidth(width);const graph=layoutMuseumTree(nodes('a','b','c','d'),[edge('a','b'),edge('a','c'),edge('a','d')],{compact:true,columns});assert.ok(graph.width<=width);assert.equal(columns,3);assert.equal(treeColumnsForWidth(750),2);
});

test("focused relationships preserve direction, partners and evidence without inventing descendants",()=>{
 const graph=layoutMuseumTree(nodes('teacher','focus','disciple','grandchild','partner','incarnation','other'),[edge('teacher','focus'),edge('focus','disciple'),edge('disciple','grandchild'),edge('focus','partner','partner'),edge('incarnation','focus','incarnation')]);
 const groups=treeNeighborhood(graph,'focus');const ids=(key:string)=>groups.find(g=>g.key===key)?.people.map(n=>n.id);
 assert.deepEqual(ids('teachers'),['teacher']);assert.deepEqual(ids('disciples'),['disciple']);assert.deepEqual(ids('partners'),['partner']);assert.deepEqual(ids('incarnations'),['incarnation']);
 assert.equal(treeNeighborhood(graph,undefined).length,0);assert.equal(treeNeighborhood(graph,'other').length,0);
});
test("whole-family overview keeps peers on one generation row",()=>{
 const graph=layoutMuseumTree(nodes('teacher',...Array.from({length:12},(_,i)=>'child'+i)),Array.from({length:12},(_,i)=>edge('teacher','child'+i)));
 assert.equal(new Set(graph.nodes.filter(n=>n.id!=='teacher').map(n=>n.y)).size,1);
});
