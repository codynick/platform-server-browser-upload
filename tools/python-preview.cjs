// Local-only static preview. Guest account response avoids requiring CAS locally.
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),port=Number(process.argv[3]||8767);
http.createServer((req,res)=>{
 if(req.url.split('?')[0]==='/api/me'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"user":null,"csrf":null}');return;}
 try{
  const name=decodeURIComponent(req.url.split('?')[0]);let file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)||name.split('/').includes('.git'))throw Error('Invalid path');
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  const data=fs.readFileSync(file),type={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.py':'text/plain','.wasm':'application/wasm'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Content-Length':data.length,'Cache-Control':'no-cache'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:'+port+'/blocks/?python=1'));
