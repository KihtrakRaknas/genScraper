const puppeteer = require('puppeteer');
const $ = require('cheerio');
const url = 'https://students.sbschools.org/genesis/parents?gohome=true';

//console.log(getData('10012734@sbstudents.org','Sled%2#9'));

getCurrentClassGrades("10013096@sbstudents.org", "Tint@%79")



//------------- code is not finished --------------------



async function scrapeCurrentClassGrades(page){
  var list = await page.evaluate(() => {
    var assignments = [];
    for(var node of document.getElementsByClassName("list")[0].childNodes[1].childNodes){

      if(node.classList && !node.classList.contains("listheading")&&node.childNodes.length>=15){
        var assignData={};
		if(!Number(node.childNodes[25].innerText))
			continue;
		assignData["Credits"] = Number(node.childNodes[25].innerText)
        //console.log(node.childNodes);
        //console.log(node.childNodes[3].innerText);
          assignData["FG"] = //NOT FINISHED
        
        assignData["Name"] = node.childNodes[1].innerText;
        assignments.push(assignData);
        }
    }
    return assignments;
  });
  return list;
}


async function getCurrentClassGrades(email, pass) {
  var grades = {};

	var email = encodeURIComponent(email);
	pass = encodeURIComponent(pass);
var url2 = 'https://students.sbschools.org/genesis/j_security_check?j_username='+email+'&j_password='+pass;

    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
      /*
        //headless: false, // launch headful mode
        //slowMo: 1000, // slow down puppeteer script so that it's easier to follow visually
      */
      });
    const page = await browser.newPage();


    await page.setRequestInterception(true);
    const blockedResourceTypes = [
      'image',
      'media',
      'font',
      'texttrack',
      'object',
      'beacon',
      'csp_report',
      'imageset',
      'stylesheet',
    ];

    const skippedResources = [
      'quantserve',
      'adzerk',
      'doubleclick',
      'adition',
      'exelator',
      'sharethrough',
      'cdn.api.twitter',
      'google-analytics',
      'googletagmanager',
      'google',
      'fontawesome',
      'facebook',
      'analytics',
      'optimizely',
      'clicktale',
      'mixpanel',
      'zedo',
      'clicksor',
      'tiqcdn',
    ];
    page.on('request', (req) => {
      const requestUrl = req._url.split('?')[0].split('#')[0];
      if (
        blockedResourceTypes.indexOf(req.resourceType()) !== -1 ||
        skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
      ) {
        req.abort();
      } else {
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

    const url3 = "https://students.sbschools.org/genesis/parents?tab1=studentdata&tab2=grading&tab3=current&action=form&studentid="+email.split("%40")[0];
    await page.goto(url3, {waitUntil: 'domcontentloaded'});
    
    let classGrades = await scrapeClassGrades(page)
  console.log("Grades gotten for: "+email)
  console.log(classGrades)
    return classGrades
    await browser.close();
  }
