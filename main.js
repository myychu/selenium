const {Builder, By, Key, until} = require('selenium-webdriver');
const buf = require('buffer');
const sleep = require('sleep');
const fs = require('fs');
const str = require('string');
 
(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    // variables
    let userdata = 'output.txt';
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

    //Keep next button value class
    let nextElement = await driver.findElement(By.xpath("//*[@id='tableJornadas_next']"));
    let nextClass = await nextElement.getAttribute('class');
    console.log(nextClass);

    while (!str(nextClass).endsWith('disabled')) {
      sleep.sleep(10);

      // Calculate how many entries there are per page
      let dataTableInfo = await driver.findElement(By.id("tableJornadas_info")).getText();
      let firstDigit = str(dataTableInfo).between('del ', ' al');
      let lastDigit = str(dataTableInfo).between('al ', ' de');
      totalEntries = (lastDigit - firstDigit) + 1;
      console.log(totalEntries);

      // Look for each entry and save it in a file
      for (let i = 1; i <= totalEntries; i++){
        let date = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[2]")).getText();
        date = date.slice(0, date.indexOf(' '));
        let worked = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[4]/span")).getText();
        let stopped = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[5]/span")).getText();
        let total = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[6]/span")).getText();
       
        wstream.write ('Date: ' + date + ', worked: ' + worked + ', stopped: ' + stopped + ', total: ' + total + '\n');

      };

      // Check the status of next page button
      nextElement = await driver.findElement(By.xpath("//*[@id='tableJornadas_next']"));
      nextClass = await nextElement.getAttribute('class');
      await nextElement.click();  
    }

    wstream.end();
    // fs.close();

  } finally {
    // await driver.quit();
  }
})();