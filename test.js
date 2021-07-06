const { chromium } = require('playwright');
const ocrSpace = require('ocr-space-api-wrapper');

(async () => {
	let date = new Date();
	let starTime = date.getTime(); //开始的时间
	let hour = date.getHours();  //获取小时，用于判定是否上传数据
        console.log('starTime ' + starTime);
	console.log('hour ' + hour);
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

				
		await page.waitForSelector('//*[@id="app"]/div[2]/div/div[3]/div/span[1]'); 
        	let tempCoin = await page.innerText('//*[@id="app"]/div[2]/div/div[3]/div/span[1]'); 
		let srcCoin = tempCoin.substring(0, tempCoin.length-6);//原始的Coin
		srcCoin = parseInt(srcCoin);
		console.log('srcCoin: ' + srcCoin);
		let addCoin = 0;  //增加的Coin
//		let countWin = 0;  //连赢次数
		let countLose = 0;  //连输次数
		let isLose = null;   //判断是否输
		let isWin = null; //判断是否赢
		let countItem = 0;
		
		let nowTime = new Date().getTime(); //现在的时间
		//let passTime = Math.round((nowTime - starTime) / 1000 / 60 ); //经过多少分钟
		let passTime = nowTime - starTime;
		console.log('passTime ' + passTime);
		
		
		
		// Play the Multiplier
		//判断是否被禁止
		let pageurl2 = null;   
		let homeurl2 = "https://cointiply.com/pg";
		
		try{
			await page.goto('https://cointiply.com/pg');
			await page.waitForTimeout(10000);
			pageurl2 = await page.url();
			if(pageurl2 != homeurl2){
				passTime = 200000000; //设置时间大于30分钟 不执行multi
				console.log('被官方禁止');
			}else{
				await page.click("text=/.*Start Round.*/");
				await page.waitForTimeout(3000);
				await page.click("img[id=\"item-one\"]"); 
				console.log('<150 clidk 1');
				addCoin = addCoin - 10;
				console.log('addCoin - 10'); //打印当前连输数 和 coin的增加数
				console.log('countLose : ' + countLose + ' addCoin: '+ addCoin); //打印当前连输数 和 coin的增加数
				countItem++;
				await page.waitForTimeout(3000);
			}
		}catch{
			await page.goto('https://cointiply.com/pg');
			await page.waitForTimeout(20000);
			pageurl2 = await page.url();
			if(pageurl2 != homeurl2){
				passTime = 200000000; //设置时间大于30分钟 不执行multi
				console.log('被官方禁止');
			}else{			
				await page.click("text=/.*Start Round.*/");
				await page.waitForTimeout(10000);
				await page.click("img[id=\"item-one\"]"); 
				console.log('<150 clidk 1');
				addCoin = addCoin - 10;
				console.log('addCoin - 10'); //打印当前连输数 和 coin的增加数
				console.log('countLose : ' + countLose + ' addCoin: '+ addCoin); //打印当前连输数 和 coin的增加数
				countItem++;
				await page.waitForTimeout(10000);
			}
		}
		
		
		let isEnough = srcCoin + addCoin;   //isEnough 必须大于50 才会运行mulit
		//console.log(isEnough);
		while(passTime < 1800000 && isEnough > 50 && addCoin < 400){ //少于50分钟重复运行	
			try{
				isLose = await page.$("div[id=\"endNav\"] >> text=/.*Start Round.*/");  //判断是否有 start round 按钮
				if(isLose != null){  //输
                    console.log('Its lose');
					countWin = 0;								
					countLose++;
					if(countLose == 8){
						console.log('countLose 超过7');
						countLose = 0;
					}
					await page.waitForSelector("input[type=\"text\"]");
					switch (countLose){  //修改下注数
						case 0:
							await page.fill("input[type=\"text\"]", "10");
							break;
						case 1:
							if(srcCoin > 100){
								await page.fill("input[type=\"text\"]", "40");
							}else{
								await page.fill("input[type=\"text\"]", "10");
							}
							break;
						case 2:
							if(srcCoin > 500){
								await page.fill("input[type=\"text\"]", "160");
							}else{
								await page.fill("input[type=\"text\"]", "10");
							}
							break;
						case 3:
							if(srcCoin > 1000){
								await page.fill("input[type=\"text\"]", "640");
							}else{
								await page.fill("input[type=\"text\"]", "10");
							}
							break;
						case 4:
							if(srcCoin > 10000){
								await page.fill("input[type=\"text\"]", "2560");
							}else{
								await page.fill("input[type=\"text\"]", "10");
							}
							break;
						case 5:
							if(srcCoin > 15000){
								await page.fill("input[type=\"text\"]", "10240");
							}else{
								await page.fill("input[type=\"text\"]", "10");
							}
							break;
						case 6:
							if(srcCoin > 50000){
								await page.fill("input[type=\"text\"]", "40960");
							}else{
								await page.fill("input[type=\"text\"]", "10");
							}
							break;
						case 7:
							if(srcCoin > 20000){
								await page.fill("input[type=\"text\"]", "163840");
							}else{
								await page.fill("input[type=\"text\"]", "10");
							}
							break;
					}				
				}else{  //赢 
					isWin = page.$("text=/.*Take Win.*/");  //判断是否有 take win 按钮
					if(isWin != null){
						console.log('Its win');
						switch (countLose){
							case 0:  								
								await page.click("text=/.*Take Win.*/");									
								addCoin = addCoin + 14;
								console.log('addCoin + 14');
								break;
							case 1:
								await page.click("text=/.*Take Win.*/");
								countLose = 0;
								addCoin = addCoin + 56;
								console.log('addCoin + 56');
								break;
							case 2:
								await page.click("text=/.*Take Win.*/");
								countLose = 0;
								addCoin = addCoin + 224;
								console.log('addCoin + 224');
								break;
							case 3:
								await page.click("text=/.*Take Win.*/");
								countLose = 0;
								addCoin = addCoin + 896;
								console.log('addCoin + 896');
								break;
							case 4:
								await page.click("text=/.*Take Win.*/");
								countLose = 0;
								addCoin = addCoin + 3584;
								console.log('addCoin + 3584');
								break;
							case 5:
								await page.click("text=/.*Take Win.*/");
								countLose = 0;
								addCoin = addCoin + 14336;
								console.log('addCoin + 14336');
								break;
							case 6:
								await page.click("text=/.*Take Win.*/");
								countLose = 0;
								addCoin = addCoin + 57344;
								console.log('addCoin + 57344');
								break;
							case 7:
								await page.click("text=/.*Take Win.*/");
								countLose = 0;
								addCoin = addCoin + 229376;
								console.log('addCoin + 229376');
								break;
						}
						
						await page.waitForTimeout(2000);
						if(countWin == 0){
							console.log('按下 take win');
							await page.waitForSelector("input[type=\"text\"]");
							await page.fill("input[type=\"text\"]", "10");
						}
					}
				}
				await page.waitForTimeout(3000);				
				await page.click("div[id=\"endNav\"] >> text=/.*Start Round.*/"); 
				console.log('按下 start round');
				switch (countLose){  //addCoin减去下注数
					case 0:
						addCoin = addCoin - 10;
						console.log('addCoin - 10');
						break;
					case 1:
						addCoin = addCoin - 40;
						console.log('addCoin - 40');
						break;
					case 2:
						addCoin = addCoin - 160;
						console.log('addCoin - 160');
						break;
					case 3:
						addCoin = addCoin - 640;
						console.log('addCoin - 640');
						break;
					case 4:
						addCoin = addCoin - 2560;
						console.log('addCoin - 2560');
						break;
					case 5:
						addCoin = addCoin - 10240;
						console.log('addCoin - 10240');
						break;
					case 6:
						addCoin = addCoin - 40960;
						console.log('addCoin - 40960');
						break;
					case 7:
						addCoin = addCoin - 163840;
						console.log('addCoin - 163840');
						break;
				}
				await page.waitForTimeout(2000);
				//选择item
				if(addCoin < 50){    //coin 低于100 顺序选择item
					switch (countItem) {
						case 0:
							await page.click("img[id=\"item-one\"]"); 
							console.log('<150 clidk 1');
							countItem++;
							break;
						case 1:
							await page.click("img[id=\"item-three\"]");
							console.log('<150 clidk 3');
							countItem++;
							break;
						case 2:
							await page.click("img[id=\"item-eight\"]");
							console.log('<150 clidk 8');
							countItem++;
							break;
						case 3:
							await page.click("img[id=\"item-ten\"]");
							console.log('<150 clidk 10');
							countItem = 0;
							break;
					}			
				}else{     //coin 》100 随机选择item
					let chooseBt = Math.round(Math.random()*10);
					switch (chooseBt) {
						case 0:
							await page.click("img[id=\"item-one\"]"); 
							console.log('clidk 1');
							break;
						case 1:
							await page.click("img[id=\"item-two\"]");
							console.log('clidk 2');
							break;
						case 2:
							await page.click("img[id=\"item-three\"]");
							console.log('clidk 3');
							break;
						case 3:
							await page.click("img[id=\"item-four\"]");
							console.log('clidk 4');
							break;
						case 4:
							await page.click("img[id=\"item-five\"]");
							console.log('clidk 5');
							break;
						case 5:
							await page.click("img[id=\"item-eleven\"]");
							console.log('clidk 11');
							break;
						case 6:
							await page.click("img[id=\"item-six\"]");
							console.log('clidk 6');
							break;
						case 7:
							await page.click("img[id=\"item-seven\"]");
							console.log('clidk 7');
							break;
						case 8:
							await page.click("img[id=\"item-eight\"]");
							console.log('clidk 8');
							break;
						case 9:
							await page.click("img[id=\"item-nine\"]");
							console.log('clidk 9');
							break;
						case 10:
							await page.click("img[id=\"item-ten\"]");
							console.log('clidk 10');
							break;							
					}		
				}
				isLose = null; //恢复isLose 和 isWin 默认值 等待下一次判断
				isWin = null;
				await page.waitForTimeout(1000);
				
				console.log('countLose : ' + countLose + ' addCoin: '+ addCoin); //打印当前连输数 和 coin的增加数
				
				nowTime = new Date().getTime(); //现在的时间
				//passTime = Math.round((nowTime - starTime) / 1000 / 60 ); //经过多少分钟
				//console.log(passTime + "分钟");
				passTime = nowTime - starTime;
				console.log('passTime ' + passTime);
				isEnough = srcCoin + addCoin;
			}catch{   //出错刷新网页
				await page.goto('https://cointiply.com/pg');
				await page.waitForTimeout(10000);
				pageurl2 = await page.url();
				if(pageurl2 != homeurl2){
					passTime = 200000000; //设置时间大于30分钟 不执行multi
					console.log('被官方禁止');
				}else{
					await page.click("text=/.*Start Round.*/");
					await page.waitForTimeout(3000);
					await page.click("img[id=\"item-one\"]"); 
					console.log('<150 clidk 1');
					addCoin = addCoin - 10;
					console.log('countLose : ' + countLose + ' addCoin: '+ addCoin); //打印当前连输数 和 coin的增加数
					countItem++;
					await page.waitForTimeout(3000);
				}
			}				
		}
		//提交coin信息
		try{
			if(hour == 9){
				await page.goto("https://docs.google.com/forms/d/e/1FAIpQLSfMZFZNI4mLD7z5Ou_uGqtLKnJe-uKqbs99IM9lOO6-DZPn_w/viewform?usp=send_form"); 
				await page.waitForTimeout(10000);
				//await page.click("input[type=\"text\"]");
				await page.keyboard.press('Tab');
				await page.keyboard.press('Tab');
				//await page.fill("input[type=\"text\"]", name);
				await page.keyboard.type(name);
				console.log('输入名字');
				await page.waitForTimeout(3000);
				await page.keyboard.press('Tab');				
				//await page.fill("(//div[normalize-space(@role)='listitem']/div/div/div[2]/div/div[1]/div/div[1]/input[normalize-space(@type)='text'])[2]", srcCoin);
				await page.keyboard.type(srcCoin + ' Coins');
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

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
