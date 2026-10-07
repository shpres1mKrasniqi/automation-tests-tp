require('dotenv').config({path:'.env',quiet:true});
const {firefox}=require('@playwright/test');
(async()=>{
 const [,,host,path,sel]=process.argv;
 const b=await firefox.launch();
 const c=await b.newContext({httpCredentials:{username:process.env.HTTP_USERNAME,password:process.env.HTTP_PASSWORD},viewport:{width:1400,height:900}});
 const p=await c.newPage();
 await p.goto('https://staging.'+host+path,{waitUntil:'load'});
 await p.waitForTimeout(3000);
 const acc=p.locator('#usercentrics-cmp-ui button:has-text("Alles akzeptieren")').first();
 if(await acc.isVisible().catch(()=>false)){await acc.click();}
 const f=p.frameLocator(sel);
 await p.waitForTimeout(6000);
 console.log((await f.locator('body').innerText()).replace(/\s+/g,' ').slice(0,800));
 console.log(await f.locator('input,textarea,select,button').evaluateAll(e=>e.map(x=>`${x.tagName}|${x.type}|${x.name}|${x.id}|${x.placeholder}|${(x.innerText||'').slice(0,30)}`)));
 await b.close();
})();
