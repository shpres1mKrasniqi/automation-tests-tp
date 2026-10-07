require('dotenv').config({path:'.env',quiet:true});
const {firefox}=require('@playwright/test');
(async()=>{
 const [,,host,path,body]=process.argv;
 const b=await firefox.launch();
 const c=await b.newContext({httpCredentials:{username:process.env.HTTP_USERNAME,password:process.env.HTTP_PASSWORD},viewport:{width:1400,height:900}});
 const page=await c.newPage();
 await page.goto('https://staging.'+host+path,{waitUntil:'load'});
 await page.waitForTimeout(3000);
 const acc=page.locator('#usercentrics-cmp-ui button:has-text("Alles akzeptieren")').first();
 if(await acc.isVisible().catch(()=>false)){await acc.click();await page.waitForTimeout(500);}
 try{ await eval('(async()=>{'+body+'})()'); }catch(e){console.log('ERR',e.message)}
 await b.close();
})();
