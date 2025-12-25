(async ()=>{
  try{
    const res = await fetch('http://127.0.0.1:3000/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username:'admin', password:'123'})
    });
    const txt = await res.text();
    console.log('status', res.status);
    console.log(txt);
  }catch(e){console.error('fetch error', e)}
})();
