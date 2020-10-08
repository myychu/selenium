const {Builder, By, Key, until} = require('selenium-webdriver');
const buf = require('buffer');
const sleep = require('sleep');
const fs = require('fs');
 
(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    // variables
    let userdata = 'testSelenium.txt';
    let credentials = 'credentials.txt';
    let wstream = fs.createWriteStream(userdata);
    let user = '';
    let pwd = '';
    fs.readFile(credentials, 'utf8', function(err,data){
      if(err) throw err;
      user = (data.split('user:')[1]).split('pwd')[0];
      pwd = data.split('pwd:')[1];
    });

    // login
    await driver.get('https://panel.chapp.es/Identity/Account/Login?ReturnUrl=%2F');
    let buff = new buf.Buffer.from(user, 'base64');
    await driver.findElement(By.name('Input.Email')).sendKeys(buff.toString('UTF-8'), Key.TAB);
    buff = new buf.Buffer.from(pwd, 'base64');
    await driver.findElement(By.name('Input.Password')).sendKeys(buff.toString('UTF-8'), Key.RETURN);

    // Go to Jornadas
    await driver.findElement(By.linkText('Jornadas')).click();

    // Wait until the page charges
    sleep.sleep(10);

    // Keep worked time elements on this page
    let userEmail = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[1]/td[1]/span")).getText();
    wstream.write('Entries made by ' + userEmail + ':\n');

    for (let i = 1; i <= 10; i++){
      let date = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[2]")).getText();
      date = date.slice(0, date.indexOf(' '));
      let worked = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[4]/span")).getText();
      let stopped = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[5]/span")).getText();
      let total = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[6]/span")).getText();
      if (i < 10){
        wstream.write ('Date: ' + date + ', worked: ' + worked + ', stopped: ' + stopped + ', total: ' + total + '\n');
      } else {
        wstream.write ('Date: ' + date + ', worked: ' + worked + ', stopped: ' + stopped + ', total: ' + total);
      }
    };
    
    wstream.end();
    // fs.close();

  } finally {
    // await driver.quit();
  }
})();