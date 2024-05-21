const puppeteer = require("puppeteer-extra");
const fs = require("fs").promises;
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

async function start() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
   //headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });
  const page = await browser.newPage();

  //load cookies
  const cookiesString = await fs.readFile(
    "./cookies/delionix.com.cookies.json"
  );
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);
  let counter = 0;

  await page.goto("https://delionix.com/members/", { waitUntil: "load" });
  await sleep(1000);
  await page.waitForSelector("a[href*=work-youtube]");

  await Promise.all([
    page.click("a[href*=work-youtube]"),
    page.waitForNavigation({ waitUntil: "load" }),
  ]);
  await await sleep(1000);
  let link = "div[id*=start-ads]>span[onclick]";

  await page.waitForSelector(link);
  //////////////////////////////

  let links = await page.$$(link);
console.log(links.length);
  for (const el of links) {
    let linkId = await el.evaluate((el) => {
      let div = el.closest("div");
      id = div.getAttribute("id");
      return id.split("-")[2];
    });
    console.log(linkId);
    let btn = `div[id*=ads-lk-${linkId}] a`;
    try {
      let newTarget;
      const pageTarget = page.target();
      try {
        await el.click();
        await sleep(1000);
        await page.waitForSelector(btn, {
          timeout: 11000,
        });
      } catch (error) {
        console.log(error);
        //Если ссылка битая или не открывается переходим к другой ссылке
        continue;
      }
      await sleep(1000);
      await Promise.all([
        page.click(btn, {
          visible: true,
        }),
        (newTarget = await browser.waitForTarget(
          (target) => target.opener() === pageTarget
        )),
      ]);

      const newPage = await newTarget.page();

      await newPage.waitForNetworkIdle();
      const frameHandle = await newPage.waitForSelector("iframe");
      let timer = await newPage.evaluate(
        () => document.querySelector("#tmr")?.textContent
      );
      await sleep(1000);
      console.log(timer);
      const frame = await frameHandle.contentFrame();
      console.log(1);
      await sleep(3000);
      let noYoutubeButton = false;
      console.log(2);
      try {
        await frame.waitForSelector(
          ".ytp-large-play-button.ytp-button.ytp-large-play-button-red-bg"
        );
        console.log(2.5);
        await sleep(500);
        await frame.click(
          ".ytp-large-play-button.ytp-button.ytp-large-play-button-red-bg"
        );
        console.log(3);
      } catch (error) {
        console.log("Oshipka poiska knopki", error);
        noYoutubeButton = true;
        await sleep(1000);
      }
      if (!noYoutubeButton) {
        await sleep(+timer * 1000 + 3000);
      }
      await newPage.evaluate(() => {
        document.querySelector("button.butt-nw").click();
      });

      await sleep(2000);
      await newPage.close();
      await sleep(1000);
    } catch (error) {
      console.log("Error from main try-catch", error);
      break;
    }
    console.log(counter++, new Date());
  }
  await browser.close();
}
start();
