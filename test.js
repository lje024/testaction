const puppeteer = require("puppeteer");

(async () => {
	const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    	});
	const page = await browser.newPage();
	await page.setDefaultNavigationTimeout(0);
	await page.setViewport({
            width: 1920,
            height: 1080
        });
	var url = 'https://freecash.com';
	console.log('go to url');
	await page.goto(url);
	let islogin = false;
	while(islogin == false){
		await page.waitForTimeout(5000);
		console.log('click sign im');
		await page.click('button.account-item:nth-child(1)');
		await page.waitForTimeout(10000);
		console.log('type username');
		await page.type('#login-username', '162345671edb@drmail.in', {delay: 100});
		await page.waitForTimeout(1000);
		console.log('type password');
		await page.type('#login-password', 'Sj123456789', {delay: 100});
	    console.log('click login');
		await page.click('#login-button');
		await page.waitForTimeout(10000);
		let urlcheck = await page.url();
		if(urlcheck == 'https://freecash.com/earn'){
			islogin = true;
		}
	}
	console.log('login in');
	let adgate = await page.waitForSelector('.offerwallContainer.offerwallContainer--lootably.earn-page-card.earn-page-card-large.splide__slide.is-visible');
    	let adgatePosition = await page.evaluate(element => {
		const {x, y, width, height} = element.getBoundingClientRect()
		return {x, y, width, height}
	}, adgate);
	let x = adgatePosition.x + adgatePosition.width / 2;
	let y = adgatePosition.y + adgatePosition.height / 2;
	console.log('click lootably');
	await page.mouse.click(x, y);
	await page.waitForTimeout(10000);
	console.log('lootably in');
	let elementHandle = await page.waitForSelector('div#lootablyModalIframeContain iframe');
	let frame = await elementHandle.contentFrame();
	console.log('click quizzes');
	let quiz = await frame.$x('//button[contains(.,"Quizzes")]');
	await quiz[0].click();
	await frame.waitForTimeout(10000);
	let options = await frame.$$eval('div > span', options => {
		return options.map(option => option.textContent);
	});
	console.log(options);
	let coins = await frame.$$eval('div > button', coins => {
		return coins.map(coin => coin.textContent);
	});
	console.log(coins);
	
	await browser.close();	
})();	


	
	
		
