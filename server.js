const puppeteer = require('puppeteer');
const $ = require('cheerio');


//console.log(getData('10012734@sbstudents.org','Sled%2#9'));

getData("10013096@sbstudents.org", "Tint@%79")


async function scrapeMP(page){
  var list = await page.evaluate(() => {
    var assignments = [];
    for(var node of document.getElementsByClassName("list")[0].childNodes[1].childNodes){

      if(node.classList && !node.classList.contains("listheading")&&node.childNodes.length>=11){
        var assignData={};

        //console.log(node.childNodes);
        //console.log(node.childNodes[3].innerText);
          assignData["Date"] = node.childNodes[3].innerText;
        //console.log(node.childNodes[7].innerText);
        assignData["Category"] = node.childNodes[7].innerText
        //console.log(node.childNodes[9].innerText);
        assignData["Name"] = node.childNodes[9].innerText;
        //console.log(node.childNodes[11].childNodes[0].textContent.replace(/\s/g,''));
        assignData["Grade"] = node.childNodes[11].childNodes[0].textContent.replace(/\s/g,'')
        assignments.push(assignData);
        }
    }
    return assignments;
  });
  return list;
}

const url = 'https://students.sbschools.org/genesis/parents?gohome=true';
async function getData(email, pass) {
  var grades = {};

	var email = encodeURIComponent(email);
	pass = encodeURIComponent(pass);
var url2 = 'https://students.sbschools.org/genesis/j_security_check?j_username='+email+'&j_password='+pass;

    const browser = await puppeteer.launch({
      //args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ///*
        headless: false, // launch headful mode
        //slowMo: 250, // slow down puppeteer script so that it's easier to follow visually
      //*/
      });
    const page = await browser.newPage();

    /*await page.setViewport({
	    width: 1920,
	    height: 1080
	})*/

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() === 'image' || req.resourceType() === 'media'){
            req.abort();
        }
        else {
            req.continue();
        }
	});

    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await page.goto(url2, {waitUntil: 'domcontentloaded'});

    var signedIn = false;
    if(await $('.sectionTitle', await page.content()).text().trim() != "Invalid user name or password.  Please try again.")
      signedIn = true;
    if(!signedIn){
      await browser.close();
      console.log("BAD user||pass")
      return {Status:"Invalid"};
    }

    await page.evaluate(text => [...document.querySelectorAll('*')].find(e => e.textContent.trim() === text).click(), "Gradebook");
	await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
  await page.evaluate(text => [...document.querySelectorAll('*')].find(e => e.textContent.trim() === text).click(), "Course Summary");
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' })

  const classes = await page.evaluate( () => (Array.from( (document.getElementById("fldCourse")).childNodes, element => element.value ) ));

  for(var indivClass of classes){
    if(indivClass){
      //indivClass
      await page.evaluate((classID) => changeCourse(classID),indivClass);
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
      const markingPeriods = await page.evaluate( () => (Array.from( (document.getElementById("fldSwitchMP")).childNodes, element => element.value ) ));
      const defaultMP = await page.evaluate(()=>document.getElementById("fldSwitchMP").value);
      markingPeriods.splice(markingPeriods.indexOf(defaultMP), 1);

      const ClassName = await page.evaluate((classID)=>document.querySelectorAll('[value="'+classID+'"]')[0].innerText,indivClass);
      if(!grades[ClassName])
        grades[ClassName] = {}
      grades[ClassName]["teacher"] = await page.evaluate(()=>document.getElementsByClassName("list")[0].childNodes[1].childNodes[4].childNodes[5].innerText)
      if(!grades[ClassName][defaultMP])
        grades[ClassName][defaultMP] = {}
      grades[ClassName][defaultMP]["Assignments"] = await scrapeMP(page);
      console.log(grades[ClassName][defaultMP]["Assignments"])
      for(var indivMarkingPeriod of markingPeriods){
        if(indivMarkingPeriod){
            await page.evaluate((indivMP) => {
              document.getElementById("fldSwitchMP").value = indivMP;
              displayMPs();
              document.getElementsByTagName("BUTTON")[1].click()//"Switch Marking Period btn"
            },indivMarkingPeriod);
            await page.waitForNavigation({ waitUntil: 'domcontentloaded' })

            if(!grades[ClassName][indivMarkingPeriod])
              grades[ClassName][indivMarkingPeriod] = {}
            grades[ClassName][indivMarkingPeriod]["Assignments"] = await scrapeMP(page);
        }
      }
    }
  }
  grades["Status"] = "Completed";
  console.log("Grades gotten for: "+email)
    return grades;
    await browser.close();
  }