const { chromium } = require('playwright');
const cheerio = require('cheerio');
const got = require('hooman');

(async () => {
	try{
		const { body } = await got('https://techblog.willshouse.com/2012/01/03/most-common-user-agents/');
		const $ = cheerio.load(body);
		const userAgents = $('tbody .useragent')
	        .map(function () {
	          return $(this).text()
	        })
	        .get();	
		let num = userAgents.length;
	        //await console.log("共有" + num + "个UA" );	
		let UAnum = Math.round(Math.random()*num);
		let row = "row-" + UAnum;
		//await console.log(row);
		//await console.log(userAgents[UAnum]);

		//for (let i = 0, len = num; i < len; i++) {
		//await console.log(userAgents[i]);
			//await console.log("-------");
	       //}

		const browser = await chromium.launch({headless: false});
		const context = await browser.newContext({
			userAgent: userAgents[UAnum]
	        //		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
		});
		const page = await context.newPage();
		await page.goto("https://khazrakh.blogspot.com/");
		let isclick = Math.round(Math.random()); 
		if(isclick == 1){
			await page.waitForTimeout(10000);
			await page.keyboard.press('Tab');
			await page.waitForTimeout(500);
			await page.keyboard.press('Tab');
			await page.waitForTimeout(500);
			await page.keyboard.press('Tab');
			await page.waitForTimeout(500);
			await page.keyboard.press('Tab');
			await page.waitForTimeout(500);
			await page.keyboard.press('Tab');
			await page.waitForTimeout(500);
			await page.keyboard.press('Tab');
			await page.waitForTimeout(500);
			await page.keyboard.press('Tab');
			await page.waitForTimeout(500);
			await page.keyboard.press('Enter');
			console.log('点击ad'); 
		}
		await browser.close();
	}catch{
		console.log('error');
		await browser.close();
	}
})();
