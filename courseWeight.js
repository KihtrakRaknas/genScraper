const puppeteer = require('puppeteer');
const fs = require('fs')
const url = 'https://sbhs.sbschools.org/school_information/course_listings/2019-2020_course_listings';

//console.log(getData('10012734@sbstudents.org','Sled%2#9'));

getCourseWeight('https://sbhs.sbschools.org/school_information/course_listings/2019-2020_course_listings')


async function scrapeCourseData(page){
  var obj = await page.evaluate(() => {
    var classesWithWeighting = {};
    for(table of document.getElementsByTagName("tr")){
      if(table.childNodes.length == 9&&table.childNodes[7].innerText.trim().includes("Weighting")){
        for(info of table.childNodes[7].innerText.trim().split("\n")){
          if(info.includes("Weighting")){
            classesWithWeighting[table.childNodes[3].innerText.trim()] = info.trim();
          } 
        }
      }else if(table.childNodes.length == 9){
        if(table.childNodes[3].innerText.trim().includes("Advanced Placement"))
          classesWithWeighting[table.childNodes[3].innerText.trim()] = "A.P. Weighting";
        if(table.childNodes[3].innerText.trim().includes("Honors"))
          classesWithWeighting[table.childNodes[3].innerText.trim()] = "Honors Weighting";
        else
        classesWithWeighting[table.childNodes[3].innerText.trim()] = "N/A";
      }
    }
    return classesWithWeighting;
  });
  console.log(obj)
  return obj;
}


async function getCourseWeight(url) {
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
      
        //headless: false, // launch headful mode
        //slowMo: 1000, // slow down puppeteer script so that it's easier to follow visually
      
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

    await page.goto(url, {waitUntil: 'networkidle2'});

    var obj = await scrapeCourseData(page);

    //SPECIAL CASES

    obj["Honors Chemistry I"]=obj["Honors Chemistry"];

    delete obj["Honors Chemistry"];

    try {
      fs.writeFileSync('classWeightingOutput.json', JSON.stringify(obj))
      console.log("File added to classWeightingOutput.json!")
    } catch (err) {
      console.error(err)
    }
    console.log("DONE")
  }
