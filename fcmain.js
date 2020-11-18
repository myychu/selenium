const {Builder, By, Key, until} = require('selenium-webdriver');
const fs = require('fs');
const buf = require('buffer');

(async function web() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        let output = "output.txt"
        let wstream = fs.createWriteStream(output);
        
        // Go to General
        await driver.get('https://www.forocoches.com/foro/forumdisplay.php?f=2')
        
        let title
        let author
        let n_answers
        let n_views


        let rows = await driver.findElements(By.xpath("//*[@id='threadbits_forum_2']/tr"))
        console.log("total rows: " + rows.length)
        
        // Take all titles without pushpins
        for (let i = 1; i <= rows.length; i++){
          title = await driver.findElement(By.xpath("//*[@id='threadbits_forum_2']/tr[" + i + "]/td[3]/div[1]/a"))
          author = await driver.findElement(By.xpath("//*[@id='threadbits_forum_2']/tr[" + i + "]/td[3]/div[2]/span"))
          n_answers = await driver.findElement(By.xpath("//*[@id='threadbits_forum_2']/tr[" + i + "]/td[5]/div/a"))
          n_views = await driver.findElement(By.xpath("//*[@id='threadbits_forum_2']/tr[" + i + "]/td[5]/div/span"))
          
          console.log("ENTRY " + i + ":\n")
          console.log(await title.getText())
          console.log(await author.getText())
          console.log(await n_answers.getText())
          console.log(await n_views.getText())
          console.log("----------------------------end entry--------------------------")
        }
        

      // console.log(await thread1.getText())
      // console.log(await thread2.getText())
/*
        for (let limit = 0; limit < threads.length; limit++){
            console.log(threads[limit].getText())
        }
  */      
    } finally {
        console.log("-----end------")
        await driver.quit()
    }
})()

/*
XPath de títulos:

//*[@id="td_threadtitle_8142171"]/div[1]/b
//*[@id="thread_title_8142171"]
/html/body/div[3]/div/div/table[1]/tbody/tr/td[3]/form[2]/table[4]/tbody[2]/tr[1]/td[3]/div[1]/a
--> Yo quiero coger todos los títulos del tbody[3]:
/html/body/div[3]/div/div/table[1]/tbody/tr/td[3]/form[2]/table[4]/tbody[3]/tr[1]/td[3]/div[1]/a

/html/body/div[3]/div/div/table[2]/tbody/tr/td


*/