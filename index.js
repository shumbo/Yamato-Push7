const co = require('co');
const cheerio = require('cheerio');
const axios = require('axios');
const CronJob = require('cron').CronJob;

const url = process.env.URL;
const appno = process.env.APPNO;
const apikey = process.env.APIKEY;

let saved = [];

function process() {
  co(function* () {
    const html = yield axios.get(url).then(h => h.data);
    let $ = cheerio.load(html);
    const elements = $('.meisai').find('tr');
    elements.splice(0, 1);
    const data = elements.toArray().map(e => {
      const tds = $(e).find('td').toArray();
      return {
        status: $(tds[1]).text(),
        date: $(tds[2]).text(),
        time: $(tds[3]).text(),
        name: $(tds[4]).text()
      }
    });
    const tmp = data.concat();
    data.splice(0, saved.length);
    saved = tmp;
    const tasks = data.map(d=>{
      return axios.post(`https://api.push7.jp/api/v1/${appno}/send`,{
        title: 'ステータス更新',
        body: d.status,
        icon: 'https://i.imgur.com/DXTlaTE.png',
        url,
        apikey
      });
    });
    console.log(tasks.length);
    yield Promise.all(tasks);
  });
}
new CronJob({
  cronTime: '*/10 * * * * *',
  onTick: process,
  start:true
});