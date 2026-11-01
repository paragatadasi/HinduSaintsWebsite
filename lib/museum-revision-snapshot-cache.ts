// One build at a time across readers. Never reuse an older in-flight build for
// a newer requested revision; start a fresh snapshot if its result does not match.
export class RevisionSnapshotCache<T extends {revision:string}>{
 private readonly values=new Map<string,T>();
 private pending:Promise<T>|null=null;
 constructor(private readonly capacity=2){}
 async read(revision:string,build:()=>Promise<T>):Promise<T>{
  const cached=()=>{const value=this.values.get(revision);if(value){this.values.delete(revision);this.values.set(revision,value);}return value;};
  let value=cached();if(value)return value;
  while(this.pending){await this.pending;value=cached();if(value)return value;}
  const pending=build();this.pending=pending;
  try{
   value=await pending;this.values.delete(value.revision);this.values.set(value.revision,value);
   while(this.values.size>this.capacity)this.values.delete(this.values.keys().next().value!);
   return value;
  }finally{if(this.pending===pending)this.pending=null;}
 }
}
