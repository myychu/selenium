const {Builder, By, Key, until} = require('selenium-webdriver');
const buf = require('buffer');
const sleep = require('sleep');
const fs = require('fs');
const str = require('string');
const mysql = require('mysql');
const promisify = require('util-promisify');
const moment = require('moment');


// Create the connection to database
let conn = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'root',
  database: 'chapp', 
});

conn.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
 
(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    // variables
    let userdata = 'output.txt';
    let credentials = 'credentials.txt';
    let wstream = fs.createWriteStream(userdata);
    let user = '';
    let pwd = '';

    await driver.get('https://panel.chapp.es/Identity/Account/Login?ReturnUrl=%2F');
/* Login through a file

    fs.readFile(credentials, 'utf8', function(err,data){
      if(err) throw err;
      user = (data.split('user:')[1]).split('pwd')[0];
      pwd = data.split('pwd:')[1];
    });

    let buff = new buf.Buffer.from(user, 'base64');
    await driver.findElement(By.name('Input.Email')).sendKeys(buff.toString('UTF-8'), Key.TAB);
    buff = new buf.Buffer.from(pwd, 'base64');
    await driver.findElement(By.name('Input.Password')).sendKeys(buff.toString('UTF-8'), Key.RETURN);
*/
    // Login through a database
    const aquery = promisify(conn.query).bind(conn);
    let result = await aquery("SELECT * FROM user WHERE alias = 'pgarcia'");
    console.log(result);
    userId = result[0].id;
    user = result[0].email;
    pwd = result[0].pwd;
    console.log('id: ' +userId);

    console.log(user + ", " + pwd);

    let buff = new buf.Buffer.from(user, 'base64');
    user = "\"" + buff.toString('UTF-8') + "\"";
    await driver.findElement(By.name('Input.Email')).sendKeys(buff.toString('UTF-8'), Key.TAB);
    buff = new buf.Buffer.from(pwd, 'base64');
    pwd = "\"" + (new buf.Buffer.from(pwd, 'base64')).toString('UTF-8') + "\"";
    await driver.findElement(By.name('Input.Password')).sendKeys(buff.toString('UTF-8'), Key.RETURN);

    sleep.sleep(5);

    // Go to Jornadas
    await driver.findElement(By.linkText('Jornadas')).click();

    // Wait until the page charges
    sleep.sleep(15);

    // Keep worked time elements on this page
    let userEmail = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[1]/td[1]/span")).getText();
    wstream.write('Entries made by ' + userEmail + ':\n');

    //Keep next button value class
    let nextElement = await driver.findElement(By.xpath("//*[@id='tableJornadas_next']"));
    let nextClass = await nextElement.getAttribute('class');
    console.log(nextClass);

    // Delete previous entries
    await aquery("DELETE FROM entry WHERE userId = ?", [userId]);

    while (!str(nextClass).endsWith('disabled')) {
      sleep.sleep(10);

      // Calculate how many entries there are per page
      let dataTableInfo = await driver.findElement(By.id("tableJornadas_info")).getText();
      let firstDigit = str(dataTableInfo).between('del ', ' al');
      let lastDigit = str(dataTableInfo).between('al ', ' de');
      totalEntries = (lastDigit - firstDigit) + 1;
      console.log(totalEntries);

      // Queries to make inserts in database
      let sql_entry = 'INSERT INTO entry (date, worked, stopped, total, userId) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE date = ?, worked = ?, stopped = ?, total = ?, userId = ?';
      let sql_userEntry = 'INSERT INTO userentry (userId, entryId) VALUES (?, ?) ON DUPLICATE KEY UPDATE userId = ?, entryId = ?';

      // Look for each entry and save it in a file
      for (let i = 1; i <= totalEntries; i++){
        console.log('NEW ENTRY!!!!! -----------------------')
        let entireDate = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[2]")).getText();
        // Convert date from DD/MM/YYYY to YYYY/MM/DD
        date = entireDate.slice(0, entireDate.indexOf(' '));
        date = date.split("/").reverse().join("/");
        time = entireDate.slice(entireDate.indexOf(' '), entireDate.length);
        entireDate = date + time;

        let worked = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[4]/span")).getText();
        let stopped = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[5]/span")).getText();
        let total = await driver.findElement(By.xpath("//*[@id='tableJornadas']/tbody/tr[" + i + "]/td[6]/span")).getText();

        wstream.write ('Date: ' + entireDate + ', worked: ' + worked + ', stopped: ' + stopped + ', total: ' + total + '\n');

        // Create elements and keep them into database
        result = await aquery(sql_entry, [entireDate, worked, stopped, total, userId, entireDate, worked, stopped, total, userId]);
      };

      // Check the status of next page button
      nextElement = await driver.findElement(By.xpath("//*[@id='tableJornadas_next']"));
      nextClass = await nextElement.getAttribute('class');
      await nextElement.click();  
    }

    wstream.end();
    conn.end();
    // fs.close();

  } finally {
    // await driver.quit();
  }
})();