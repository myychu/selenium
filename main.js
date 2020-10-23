const {Builder, By, Key} = require('selenium-webdriver');
const buf = require('buffer');
const mysql = require('mysql');
const promisify = require('util-promisify');
const axios = require('axios').default;
const moment = require('moment');
const querystring = require('querystring');


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
 
(async function web() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    let user = '';
    let pwd = '';

    await driver.get('https://panel.chapp.es/Identity/Account/Login?ReturnUrl=%2F');

    // Login through a database
    const aquery = promisify(conn.query).bind(conn);
    const alias = "ccruz";
    let result = await aquery("SELECT * FROM user WHERE alias = ?", [alias]);
    console.log(result);
    userId = result[0].id;
    user = result[0].email;
    pwd = result[0].pwd;

    // Parse user and pwd from base64 to UTF-8 to use it in page inputs
    let buff = new buf.Buffer.from(user, 'base64');
    user = "\"" + buff.toString('UTF-8') + "\"";
    await driver.findElement(By.name('Input.Email')).sendKeys(buff.toString('UTF-8'), Key.TAB);
    buff = new buf.Buffer.from(pwd, 'base64');
    pwd = "\"" + (new buf.Buffer.from(pwd, 'base64')).toString('UTF-8') + "\"";
    await driver.findElement(By.name('Input.Password')).sendKeys(buff.toString('UTF-8'), Key.RETURN);

    //SQL
    // Delete previous entries
    await aquery("DELETE FROM entry WHERE userId = ?", [userId]);
    // Queries to make inserts in database
    let sql_entry = 'INSERT INTO entry (initDate, endDate, worked, stopped, total, userId) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE initDate = ?, endDate = ?, worked = ?, stopped = ?, total = ?, userId = ?';

    // sleep.sleep(5);
    let cookies = await driver.manage().getCookies(); 
    cookies = JSON.stringify(cookies);
    cookie = cookies.slice(cookies.indexOf(".AspNetCore.Identity.Application"), cookies.length);
    cookie = cookie.slice(cookie.indexOf("value\":\"") + 8, cookie.indexOf("\"},"))
    console.log("<---cookie--->\n" + cookie + "\n");

    let data = {
      'draw': 3,
      'columns[0][data]': 0,
      'columns[0][name]': '',
      'columns[0][searchable]': false,
      'columns[0][orderable]': false,
      'columns[0][search][value]': '',
      'columns[0][search][regex]': false,
      'columns[1][data]': 1,
      'columns[1][name]': '',
      'columns[1][searchable]': false,
      'columns[1][orderable]': false,
      'columns[1][search][value]': '',
      'columns[1][search][regex]': false,
      'columns[1][data]': 2,
      'columns[2][name]': '',
      'columns[2][searchable]': false,
      'columns[2][orderable]': false,
      'columns[2][search][value]': '',
      'columns[2][search][regex]': false,
      'columns[3][data]': 3,
      'columns[3][name]': '',
      'columns[3][searchable]': false,
      'columns[3][orderable]': false,
      'columns[3][search][value]': '',
      'columns[3][search][regex]': false,
      'columns[4][data]': 4,
      'columns[4][name]': '',
      'columns[4][searchable]': false,
      'columns[4][orderable]': false,
      'columns[4][search][value]': '',
      'columns[4][search][regex]': false,
      'columns[5][data]': 5,
      'columns[5][name]': '',
      'columns[5][searchable]': false,
      'columns[5][orderable]': false,
      'columns[5][search][value]': '',
      'columns[5][search][regex]': false,
      'columns[6][data]': 6,
      'columns[6][name]': '',
      'columns[6][searchable]': false,
      'columns[6][orderable]': false,
      'columns[6][search][value]': '',
      'columns[6][search][regex]': false,
      'order[0][column]': 1,
      'order[0][dir]': 'desc',
      'start': 0,
      'length': 1000,
      'search[value]': '',
      'search[regex]': false
    }

    let dataset = await axios({
      method: 'post',
      url: 'https://panel.chapponline.es/Jornada/GetJornadasAjax/',
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "es-ES,es;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        'cookie': ".AspNetCore.Identity.Application=" + cookie},
      data: querystring.encode(data)
    });

    dataset = dataset.data.data;

    console.log("entries made by " + user)
    for(let i = 0; i < dataset.length; i++){
      let initDate = moment(dataset[i].inicio, "DD/MM/YYYY hh:mm:ss").toDate();
      let endDate = moment(dataset[i].fin, "DD/MM/YYYY hh:mm:ss").toDate();
      let worked = dataset[i].trabajado;
      let stopped = dataset[i].parado;
      let total = dataset[i].total;

      // Create elements and keep them into database
      console.log(userId + " \ " + initDate + " \ " + endDate + " \ " + worked + " \ " + stopped + " \ " + total);
      result = await aquery(sql_entry, [initDate, endDate, worked, stopped, total, userId, initDate, endDate, worked, stopped, total, userId]);
    }
    
    conn.end();

  } finally {
    await driver.quit();
  }
})();