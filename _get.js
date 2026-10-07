require('dotenv').config({path:'C:/Users/krasn/Desktop/Auto-QA/shopware-playwright-suite/.env',quiet:true});
const [,,url,out]=process.argv;
const auth='Basic '+Buffer.from(process.env.HTTP_USERNAME+':'+process.env.HTTP_PASSWORD).toString('base64');
fetch(url,{headers:{authorization:auth}}).then(async r=>{const t=await r.text();require('fs').writeFileSync(out,t);console.log(r.status,r.url,t.length)});
