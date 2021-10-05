const { chromium } = require('playwright');
const ocrSpace = require('ocr-space-api-wrapper');

(async () => {
	let date = new Date();
	let starTime = date.getTime(); //开始的时间
	let hour = date.getHours();  //获取小时，用于判定是否上传数据
    console.log('starTime ' + starTime);
	console.log('hour ' + hour);
	let arguments = process.argv.splice(2);
	console.log('所传递的参数是：', arguments); 
	let name = arguments[0]; //用户名
	let pw = arguments[1];   //密码
	let ocrKEY = arguments[2];  //ocr api-key
	
	let islogin = 0;  //判断是否登录成功 1为登录成功
	let isCancel = 0; //判断是否停止任务 1为停止任务
	let ocrTime = 0; //记录尝试ocr的次数
	let openTime = 0; //记录尝试打开网页得次数
	
	const browser = await chromium.launch({ 
		headless: true
	});
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
	});
	const page = await context.newPage();
	
//login 
	while (islogin != 1 && isCancel != 1){
		console.log('打开cointiply.com');
		try {
			await page.goto('https://cointiply.com/login');
			await page.click("input[type=\"text\"]");
			await page.fill("input[type=\"text\"]", name);
			await page.click("input[type=\"password\"]");
			await page.fill("input[type=\"password\"]", pw);
		}catch (error){
			console.log('打不开网页');
			openTime++;
			if(openTime == 5){
				isCancel = 1; //重新打开网页不成功达到5次，中止任务
				console.log('尝试打开网页次数超过5次不成功！');
			}
			continue; 
		}
    
		let pic = null;
		try {
			await page.waitForSelector('#adcopy-puzzle-image-image');	
			pic = await page.$('#adcopy-puzzle-image-image');
			await page.waitForTimeout(10000);
		} catch (error) {
			console.log('图片没有加载出来！');
			ocrTime++;
			if(ocrTime == 10){
				isCancel = 1; //orc 刷新达到10次不成功，中止任务
				console.log('ocr尝试次数超过10次不成功！');
			}
            continue;
		}
		let adbt =  await page.$('#adroll_allow_all');
		if(adbt != null){
			await page.click('#adroll_allow_all');
		}
		await pic.screenshot({path: 'example.png'});
		console.log('获得login图片！');
		let answer = ""; 
		let text = await ocrSpace('./example.png', { apiKey: ocrKEY, language: 'eng', OCREngine: 2 });
	
		try{
			let code = JSON.stringify(text);
			let temp = code.match(/ParsedText":".*ErrorMessage/);
			console.log(temp[0]);
			if(temp[0].substr(13, 4) == "Ente"){
				console.log('第一种');
				answer = temp[0].substr(35, temp[0].length-50);
				answer = answer.replace(/\\n/g,'');
				console.log(answer);
				console.log('login OCR 成功！');

			}else if(temp[0].substr(13, 4) == "PLAY"){
				console.log('第二种');
				let f = await page.frames();
				console.log(f.length);
				//console.log(f);
				for(let i = 0; i < f.length; i++){
					let playBT = await f[i].$("text=\"PLAY\"");
					if(playBT != null){
						await f[i].click("text=\"PLAY\"");
						console.log('这是第 '+ i + ' 个frame');
						break;
					}					
				}				
				await page.waitForTimeout(10000);
				pic = await page.$('#adcopy-expanded-background');
				await pic.screenshot({path: 'example.png'});
				text = await ocrSpace('./example.png', { apiKey: ocrKEY, language: 'eng', OCREngine: 2 });
				code = JSON.stringify(text);
				temp = code.match(/Please Enter.*\\n/);
				console.log(temp[0]);
				answer = temp[0].substr(8, temp[0].length-29);
				answer = answer.replace(/\\n/g,'/');
				let textArray = new Array();			
				textArray = answer.split("/");
				answer = textArray[0];
				textArray = answer.split(" ");
				answer = "";
				for(let i = 1; i < textArray.length; i++){
					answer = answer + textArray[i];
				}	
				console.log(answer);
				console.log('login OCR 成功！');

				await page.click("input[id=\"adcopy-expanded-response\"]");
				await page.fill("input[id=\"adcopy-expanded-response\"]", answer);
				await page.click("text=\"Return to Page\"");
			}else{
				console.log('第三种');
				temp = code.match(/Please Enter.*ErrorMessage/);
				console.log(temp[0]);
				answer = temp[0].substr(14, temp[0].length-29);
				console.log(answer);
				console.log('login OCR 成功！');

			}
		}catch(error){
			console.log('login OCR 失败！');
			console.log(error);
			ocrTime++;
			if(ocrTime == 10){
				isCancel = 1; //orc 刷新达到10次不成功，中止任务
				console.log('ocr尝试次数超过10次不成功！');
			}
            continue;
		}
		await page.click("//div[normalize-space(.)='refresh']/input[normalize-space(@type)='text' and normalize-space(@name)='adcopy_response']");
		await page.fill("//div[normalize-space(.)='refresh']/input[normalize-space(@type)='text' and normalize-space(@name)='adcopy_response']", answer);
		
		await page.waitForTimeout(2000);
		await page.click("//button[normalize-space(.)='Login']"); 
		console.log('点击了登录按钮');
		
		let wronglogin1 = await page.$('#slider-area > div > div > div > div > div:nth-child(3) > div > form > div.text-center > div:nth-child(2) > div.md-input-container.small-captcha.md-theme-default.md-input-invalid > span');
		let wronglogin2 =await page.$('#page-top > section > div.container > div > div.lander-right > div > div:nth-child(3) > form > div:nth-child(1) > label.error');
		//预设能登录成功 把登录状态设为 1
		islogin = 1;
		if(wronglogin1 != null){
			islogin = 0;
			console.log('验证码错误！');
			continue;
		}
		if(wronglogin2 != null){
			isCancel = 1;
			console.log('登录失败，中止任务');
			continue;
		}
		await page.waitForTimeout(10000);
		let pageurl = null;
		let homeurl = "https://cointiply.com/home";
		pageurl = await page.url();
		if(pageurl != homeurl){
			islogin = 0;
			console.log('登录失败,重新登录');
			continue;
		}else{
			console.log('成功登录');
		}
	}
	
	if(isCancel != 1){
//rolling game
		ocrTime = 0; //ocr次数归0  超过10次中止roll
		let isGetRoll = 0; //判断是否 roll 成功  1为成功
		while(isGetRoll == 0 && ocrTime < 10){
			try{
				await page.goto('https://cointiply.com/home?intent=faucet');
				console.log('进入roll game');
				await page.waitForTimeout(10000);
				//判断是否能够进行roll 
				let isNotRollNow = await page.$('text=Claim Again In...');
				if(isNotRollNow == null){   //可以进行								
					await page.click("text=/.*Roll & Win.*/");
					let pic = null;				
					await page.waitForSelector('#adcopy-puzzle-image-image');	
					//await page.waitForTimeout(15000);
					await page.click('#adcopy-link-refresh');					
					await page.waitForTimeout(15000);
					pic = await page.$('#adcopy-puzzle-image-image');
					await pic.screenshot({path: 'example.png'});
					console.log('获得roll图片！');
					let answer = ""; 
					let text = await ocrSpace('./example.png', { apiKey: ocrKEY, language: 'eng', OCREngine: 2 });
					let code = JSON.stringify(text);
					let temp = code.match(/ParsedText":".*ErrorMessage/);
					console.log(temp[0]);
					if(temp[0].substr(13, 4) == "Ente"){
						console.log('第一种');
						answer = temp[0].substr(35, temp[0].length-50);
						answer = answer.replace(/\\n/g,'');
						console.log(answer);
						console.log('roll OCR 成功！');

					}else if(temp[0].substr(13, 4) == "PLAY"){
						console.log('第二种');
						let f = await page.frames();
						console.log(f.length);
						//console.log(f);
						for(let i = 0; i < f.length; i++){
							let playBT = await f[i].$("text=\"PLAY\"");
							if(playBT != null){
								await f[i].click("text=\"PLAY\"");
								console.log('这是第 '+ i + ' 个frame');
								break;
							}					
						}				
						await page.waitForTimeout(10000);
						pic = await page.$('#adcopy-expanded-background');
						await pic.screenshot({path: 'example.png'});
						text = await ocrSpace('./example.png', { apiKey: ocrKEY, language: 'eng', OCREngine: 2 });
						code = JSON.stringify(text);
						temp = code.match(/Please Enter.*\\n/);
						console.log(temp[0]);
						answer = temp[0].substr(8, temp[0].length-29);
						answer = answer.replace(/\\n/g,'/');
						let textArray = new Array();			
						textArray = answer.split("/");
						answer = textArray[0];
						textArray = answer.split(" ");
						answer = "";
						for(let i = 1; i < textArray.length; i++){
							answer = answer + textArray[i];
						}	
						console.log(answer);
						console.log('roll OCR 成功！');

						await page.click("input[id=\"adcopy-expanded-response\"]");
						await page.fill("input[id=\"adcopy-expanded-response\"]", answer);
						await page.click("text=\"Return to Page\"");
					}else{
						console.log('第三种');
						temp = code.match(/Please Enter.*ErrorMessage/);
						console.log(temp[0]);
						answer = temp[0].substr(14, temp[0].length-29);
						console.log(answer);
						console.log('roll OCR 成功！');

					}
					await page.click("//div[normalize-space(.)='Your Answer refresh']/input[normalize-space(@type)='text' and normalize-space(@name)='adcopy_response']");
					await page.fill("//div[normalize-space(.)='Your Answer refresh']/input[normalize-space(@type)='text' and normalize-space(@name)='adcopy_response']", answer);
					await page.waitForTimeout(2000);
					await page.click("text=/.*Submit Captcha & Roll.*/");
					//判断是否roll成功 
					await page.waitForTimeout(3000);
					await page.goto('https://cointiply.com/home?intent=faucet');
					await page.waitForTimeout(5000);
					isNotRollNow = await page.$('text=Claim Again In...');
					if(isNotRollNow != null){  //roll 成功
						isGetRoll = 1;
						console.log('获得coin！');
					}else{
						console.log('roll密码错误，重新尝试');
						ocrTime++;
						if(ocrTime == 10){
							console.log('roll超过10次，中止roll');
						}
					}
				}else{
					isGetRoll = 1;
					console.log('等待下一次roll');
				}							
			}catch(error){
				ocrTime++;
				if(ocrTime == 10){
					console.log('roll超过10次，中止roll');
				}else{
					console.log('roll 发生错误 ，重新尝试');
				}
			}			
		}

//mulit game
        let minCoin = 500;    //最小的coin数 少于最小coin不进行
		let pageurl2 = null;   
		let homeurl2 = "https://cointiply.com/pg";
		let mulittimes = 0;  //执行multi的次数
		let addCoin = 0;  //增加的Coin
		let countLose = 0;  //连输次数
		let isLose = null;   //判断是否输
		let isWin = null; //判断是否赢
		let countItem = 0;
		//let upline = 400; //addcoin上限
		let multitime = 1800000; //multi时间上限 30分钟
		let nowTime = new Date().getTime(); //现在的时间
		let passTime = nowTime - starTime;
		console.log('passTime ' + passTime);
		let tempCoin = null;  
		let srcCoin = null;   //拥有coin
		let baseCoin = 10;  //基数coin
		let inputCoin = 10;  //实际输入coin 
		let chooseBt = null;  //选择按哪一个
		//获取coin数
		await page.waitForSelector('//*[@id="app"]/div[2]/div/div[3]/div/span[1]'); 
        tempCoin = await page.innerText('//*[@id="app"]/div[2]/div/div[3]/div/span[1]'); 
		srcCoin = tempCoin.substring(0, tempCoin.length-6);//原始的Coin
		srcCoin = parseInt(srcCoin);
		console.log('srcCoin: ' + srcCoin);
		
		while(mulittimes < 10 && srcCoin > minCoin){  //执行multi超过3次 中止mulit
			try{
				await page.goto('https://cointiply.com/pg');
				await page.waitForTimeout(10000);
				pageurl2 = await page.url();
				if(pageurl2 != homeurl2){
					console.log('被官方禁止');
					break;
				}else{
					await page.waitForSelector('//*[@id="app"]/ul/li[1]/a');  
					tempCoin = await page.innerText('//*[@id="app"]/ul/li[1]/a'); //获取coin数
					console.log(tempCoin);
					srcCoin = tempCoin.substring(16, tempCoin.length-6);//原始的Coin
					srcCoin = parseInt(srcCoin);
					console.log('srcCoin: ' + srcCoin);
					//打开游戏的第一次选择
					await page.click("text=/.*Custom.*/");
					await page.click("input[type=\"text\"]");
					console.log('默认第一次baseCoin: 10');
					console.log('默认第一次inputCoin: 10');
					await page.click("text=/.*Start Round.*/");
					await page.waitForTimeout(3000);
					chooseBt = Math.round(Math.random()*10);
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
					srcCoin = srcCoin - 10;
					console.log('srcCoin - 10');
					console.log('countLose : ' + countLose + ' srcCoin: '+ srcCoin);
					await page.waitForTimeout(3000);				
				}			
			}catch (error){
				console.log(error);
				mulittimes++;
				continue;
			}
			
			//判断输赢 并循环游戏
            while(passTime < multitime && srcCoin > minCoin){
				try{
					isLose = await page.$("div[id=\"endNav\"] >> text=/.*Start Round.*/");  //判断是否有 start round 按钮
					if(isLose != null){  //输
						console.log('Its lose');
						countLose++;
						inputCoin = Math.pow(4,countLose)*baseCoin;
						if(inputCoin > srcCoin){
							inputCoin = baseCoin;
						}				
					}else{  //赢
						isWin = await page.$("text=/.*Take Win.*/");  //判断是否有 take win 按钮
						if(isWin != null){
							console.log('Its win');
							countLose = 0;
							await page.click("text=/.*Take Win.*/");
							console.log('按下 take win');
							srcCoin = inputCoin*1.4+srcCoin;
							console.log('srcCoin +' + inputCoin*1.4);
							if(srcCoin < 30000){
								baseCoin = 10;
							}else{
								baseCoin = (parseInt(srcCoin/10000)-1)*10;
							}
							inputCoin = baseCoin;
							await page.waitForTimeout(2000);													
						}
					}
					console.log('baseCoin: ' + baseCoin);
					console.log('inputCoin: ' + inputCoin);
					//await page.click("div[id=\"endNav\"] >> text=/.*Custom.*/");
					await page.click("div[id=\"endNav\"] input[type=\"text\"]", click_count=2);
					await page.fill("div[id=\"endNav\"] input[type=\"text\"]", inputCoin.toString());
					await page.click("div[id=\"endNav\"] >> text=/.*Start Round.*/");
					console.log('按下 start round');
					await page.waitForTimeout(3000);
					chooseBt = Math.round(Math.random()*10);
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
					srcCoin = srcCoin - inputCoin;
					console.log('srcCoin -' + inputCoin);
					console.log('countLose : ' + countLose + ' srcCoin: '+ srcCoin);  //打印当前连输数 和 coin的数
					isLose = null; //恢复isLose 和 isWin 默认值 等待下一次判断
					isWin = null;
					await page.waitForTimeout(3000);
					nowTime = new Date().getTime(); //现在的时间
					passTime = nowTime - starTime;
					console.log('passTime ' + passTime);
				}catch (error){   //出错刷新网页
					console.log(error);
					mulittimes++;
					break;
				}			
			}
			if(passTime > multitime){
				mulittimes = 3;
			}		
		}
 
//update
	try{
		if(hour == 23){
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
			await page.keyboard.type(srcCoin + ' Coin');
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
	}catch (error){
		console.log('提交信息出错'); 
	}
	
	//退出playwright
	await browser.close();	
	}
})();
