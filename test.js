const { chromium } = require('playwright');
const ocrSpace = require('ocr-space-api-wrapper');

(async () => {
	let date = new Date();
	let starTime = date.getTime(); //开始的时间
	let hour = date.getHours();  //获取小时，用于判定是否上传数据
        console.log('starTime ' + starTime);
	let arguments = process.argv.splice(2);
	//console.log('所传递的参数是：', arguments); 
	let name = arguments[0]; //用户名
	let pw = arguments[1];   //密码
	let key = arguments[2];  //ocr api-key
	//判断是否登录成功 1为成功
	let islogin = 0;
	let isCancel = 0;
	const browser = await chromium.launch({ 
	//	headless: false 
		headless: true
	});
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
	});
	const page = await context.newPage();
	while (islogin != 1 && isCancel != 1){
		
		console.log('打开cointiply.com');
		try {
			await page.goto('https://cointiply.com/login');
			await page.click("input[type=\"text\"]");
			await page.fill("input[type=\"text\"]", name);
			await page.click("input[type=\"password\"]");
			await page.fill("input[type=\"password\"]", pw);
		}catch{
			console.log('打不开网页');
			isCancel = 1;
			break;  //跳出循环
		}
		//console.log(response);
		let pic = null;
		try {
			await page.waitForSelector('#adcopy-puzzle-image-image');	
			pic = await page.$('#adcopy-puzzle-image-image');
			await page.waitForTimeout(10000);
		} catch (error) {
			console.log('图片没有加载出来！');
			await page.click('#adcopy-link-refresh');
			await page.waitForTimeout(10000);
			pic = await page.$('#adcopy-puzzle-image-image');
		}
		await pic.screenshot({path: 'example.png'});
		console.log('获得图片！');
		let password = null;
		let text = await ocrSpace('./example.png', { apiKey: key, language: 'eng', OCREngine: 2 });
		let isOCR = -1;
		//判断ocr是否成功 ，1为成功
		while(isOCR != 1){
			try {
				let code = JSON.stringify(text);
				let temp = code.match(/Please Enter.*ErrorMessage/);
				if (temp != null){
					console.log('第二种');
					console.log(temp[0]);
					password = temp[0].substr(14, temp[0].length-29);
					console.log(password);
					console.log('OCR 成功！');
					isOCR = 1;
				}else{
					console.log('第一种');
					temp = code.match(/ParsedText":".*ErrorMessage/);
					console.log(temp[0]);
					password = temp[0].substr(35, temp[0].length-50);
					//password = password.replace(/\ /g,'');
					password = password.replace(/\\n/g,'');
					console.log(password);
					console.log('OCR 成功！');
					isOCR = 1;
				}		
				
			} catch (error) {
				console.log('OCR 失败！');
				console.log(error);
				isOCR = -1;
				await page.click('#adcopy-link-refresh');
				await page.waitForTimeout(10000);
				pic = await page.$('#adcopy-puzzle-image-image');
				await pic.screenshot({path: 'example.png'});
				console.log('获得图片！');
				text = await ocrSpace('./example.png', { apiKey: key, language: 'eng', OCREngine: 2 });
			}
		}
		//ocr成功后点击登录
		await page.click("//div[normalize-space(.)='Your Answer refresh']/input[normalize-space(@type)='text' and normalize-space(@name)='adcopy_response']");
		await page.fill("//div[normalize-space(.)='Your Answer refresh']/input[normalize-space(@type)='text' and normalize-space(@name)='adcopy_response']", password);
		//await page.screenshot({path: 'example1.png'});
		await page.waitForTimeout(2000);
		await page.click("section[id=\"slider-area\"] >> text=/.*Login.*/");
		console.log('点击了登录按钮');
		//await page.waitForTimeout(10000);
		//await page.screenshot({path: 'example2.png'});
		
		let wronglogin1 = await page.$('#slider-area > div > div > div > div > div:nth-child(3) > div > form > div.text-center > div:nth-child(2) > div.md-input-container.small-captcha.md-theme-default.md-input-invalid > span');
		let wronglogin2 =await page.$('#slider-area > div > div > div > div > div:nth-child(3) > div > form > div.md-input-container.md-theme-default.md-clearable.md-has-value.md-input-invalid > span');
		//预设能登录成功 把登录状态设为 1
		islogin = 1;
		//判断是否出错，如果出错，刷新网页，把登录状态设为 0
		if(wronglogin1 != null){
			await page.reload();
			islogin = 0;
		}
		if(wronglogin2 != null){
			//await page.waitForTimeout(600000);
			//await page.reload({waitUtil: 'networkidle'});
			//islogin = 0;
			isCancel = 1;
			console.log('登录失败，退出');
		}
		await page.waitForTimeout(5000);
		let pageurl = null;
		let homeurl = "https://cointiply.com/home";
		pageurl = await page.url();
		if(pageurl != homeurl){
			await page.reload();
			islogin = 0;
			console.log('登录失败,重新登录');
		}else{
			console.log('成功登录');
		}
	
	}
	if(isCancel != 1){

		//Roll the Faucet
		await page.waitForTimeout(10000);
		//await page.click("//a[normalize-space(.)='Roll The Faucet']");
		await page.goto('https://cointiply.com/home?intent=faucet');
		console.log('进入roll game');
		await page.waitForTimeout(5000);
		//判断是否能够进行roll 
		let isNotRollNow = await page.$('text=Claim Again In...');
		if(isNotRollNow == null){			
			await page.click("text=/.*Roll & Win.*/");
			let isGet = 0;
			while(isGet < 3){
				let pic = null;
				try {					
					await page.waitForSelector('#adcopy-puzzle-image-image');	
					await page.waitForTimeout(15000);
					await page.click('#adcopy-link-refresh');					
					await page.waitForTimeout(15000);
					pic = await page.$('#adcopy-puzzle-image-image');
				} catch (error) {
					console.log('图片没有加载出来！');
					await page.click('#adcopy-link-refresh');
					await page.waitForTimeout(15000);
					pic = await page.$('#adcopy-puzzle-image-image');
				}
				await pic.screenshot({path: 'example.png'});
				console.log('获得图片！');
				let password = null;
				let text = await ocrSpace('./example.png', { apiKey: key, language: 'eng', OCREngine: 2 });
				let isOCR = -1;
				//判断ocr是否成功 ，1为成功
				while(isOCR != 1){
					try {
						let code = JSON.stringify(text);
						let temp = code.match(/Please Enter.*ErrorMessage/);
						if (temp != null){
							console.log('第二种');
							console.log(temp[0]);
							password = temp[0].substr(14, temp[0].length-29);
							console.log(password);
							console.log('OCR 成功！');
							isOCR = 1;
						}else{
							console.log('第一种');
							temp = code.match(/ParsedText":".*ErrorMessage/);
							console.log(temp[0]);
							password = temp[0].substr(35, temp[0].length-50);
							//password = password.replace(/\ /g,'');
							password = password.replace(/\\n/g,'');
							console.log(password);
							console.log('OCR 成功！');
							isOCR = 1;
						}		
						
					} catch (error) {
						console.log('OCR 失败！');
						console.log(error);
						isOCR = -1;
						await page.click('#adcopy-link-refresh');
						await page.waitForTimeout(15000);
						pic = await page.$('#adcopy-puzzle-image-image');
						await pic.screenshot({path: 'example.png'});
						console.log('获得图片！');
						text = await ocrSpace('./example.png', { apiKey: key, language: 'eng', OCREngine: 2 });
					}
				}
				await page.click("//div[normalize-space(.)='Your Answer refresh']/input[normalize-space(@type)='text' and normalize-space(@name)='adcopy_response']");
				await page.fill("//div[normalize-space(.)='Your Answer refresh']/input[normalize-space(@type)='text' and normalize-space(@name)='adcopy_response']", password);
				await page.waitForTimeout(2000);
				await page.click("text=/.*Submit Captcha & Roll.*/");
				//判断是否roll成功 
				await page.waitForTimeout(3000);
				await page.goto('https://cointiply.com/home?intent=faucet');
				await page.waitForTimeout(5000);
				isNotRollNow = await page.$('text=Claim Again In...');
				if(isNotRollNow != null){
					isGet = 6;
					console.log('获得coin！');
				}else{
					console.log('密码错误，重新尝试');
					isGet++;
					await page.click("text=/.*Roll & Win.*/");
					await page.waitForTimeout(2000);
				}
				
			}
			
		}else{
			console.log('等待下一次roll');
		}	

		
		
		//提交coin信息
		try{
			if(hour == 23){
				await page.goto("https://cointiply.com/home");
				await page.waitForTimeout(5000);
				tempCoin = await page.innerText('//*[@id="app"]/div[2]/div/div[3]/div/span[1]'); 
				srcCoin = tempCoin.substring(0, tempCoin.length-6);//原始的Coin
				srcCoin = parseInt(srcCoin);
				await page.goto("https://docs.google.com/forms/d/e/1FAIpQLSfMZFZNI4mLD7z5Ou_uGqtLKnJe-uKqbs99IM9lOO6-DZPn_w/viewform?usp=send_form"); 
				await page.waitForTimeout(10000);
				await page.click("input[type=\"text\"]");
				await page.fill("input[type=\"text\"]", name);
				console.log('输入名字');
				await page.waitForTimeout(3000);			
				await page.fill("(//div[normalize-space(@role)='listitem']/div/div/div[2]/div/div[1]/div/div[1]/input[normalize-space(@type)='text'])[2]", srcCoin);
				console.log('输入coin数'); 
				await page.waitForTimeout(3000);	
				await page.keyboard.press('Tab');
				await page.waitForTimeout(1000);
				await page.keyboard.press('Enter');
				console.log('点击提交'); 	
				await page.waitForTimeout(3000);
			}else{
				console.log('没到时间上传数据'); 	
			}		
		}catch{
			console.log('提交信息出错'); 
		}		
	}	
    await browser.close();
	
})();

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
