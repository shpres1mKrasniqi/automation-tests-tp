require('dotenv').config({path:'.env',quiet:true});
const {firefox}=require('@playwright/test');
(async()=>{
 const [,,host,...paths]=process.argv;
 const b=await firefox.launch();
 const c=await b.newContext({httpCredentials:{username:process.env.HTTP_USERNAME,password:process.env.HTTP_PASSWORD},viewport:{width:1400,height:900}});
 const p=await c.newPage();
 for(const path of paths){
  await p.goto('https://staging.'+host+path,{waitUntil:'load'});
  await p.waitForTimeout(4000);
  const acc=p.locator('#usercentrics-cmp-ui button:has-text("Alles akzeptieren")').first();
  if(await acc.isVisible().catch(()=>false)){await acc.click();await p.waitForTimeout(1000);}
  console.log('=====',path,p.url());
  console.log((await p.locator('main').first().innerText()).replace(/\s+/g,' ').slice(0,900));
  console.log('forms:',await p.locator('main form').evaluateAll(f=>f.map(x=>x.id+'|'+x.action+'|'+x.className)));
  console.log('iframes:',await p.locator('main iframe').evaluateAll(f=>f.map(x=>x.src)));
 }
 await b.close();
})();
