const http = require('http')
const url = require('url')
const eventproxy = require('eventproxy')
const superagent = require('superagent-charset')
const cheerio = require('cheerio')
const async = require("async")

const sql = require('../sql/mysql.js')

const startDate = new Date() //开始时间
const originUrl = 'http://kan.2345.com/top/rank.html'
const pageurls = [] //排行榜url
const detailPageUrlsArray = [] //
const catchDate = []
const deleteRepeat = []//去重数组


const ep = new eventproxy()



const moviedetai = (sres)=>{
	const infoArray = {}
	const $ =cheerio.load(sres.text)

	 infoArray.poster = $('.posterCon img').attr('src')//海报
	 infoArray.title = $('.txtIntroCon .tit a').attr('title') //电影名称
	 infoArray.score = $('.txtIntroCon .emScore').text()//评分
	 infoArray.jianjie	= $('.txtList .extend .sAll').text()//简介
	// const other = $('.txtList .extend .sAll')
	return infoArray
}

const isRepeat = (url)=>{
	if(deleteRepeat[url] == undefined){
		deleteRepeat[url] = 1
		return 0
	}else if(deleteRepeat[url] == 1){
		return 1
	}
}




const onRequest = (req, res) => {
    res.writeHead('200', { 'Content-Type': 'text/html;charset=utf-8' })
    res.write('<h3>successful</h3>')

    res.write(req.url)

    if(req.url =="/favicon.ico"){
    	res.end('http://p1.bqimg.com/578892/9de2d8fd61cf9c26.png')
    }else{
    	superagent.get(originUrl).charset('gbk').end((err, sres) => {
        if (err) {
            console.log(err)
            return
        }

        const $ = cheerio.load(sres.text, { decodeEntities: false })
        const pageurls_dome = $('.mt10  a').slice(0, 28)

        for (let i = 0; i < pageurls_dome.length; i++) {
            const temp_obj = {}
            temp_obj.href = pageurls_dome.eq(i).attr('href')
            temp_obj.text = pageurls_dome.eq(i).text()

            pageurls.push(temp_obj.href)

            const insert_commond = 'insert into tab_list values(null,?,?);'
            let 	insert_commond_params = [temp_obj.text,temp_obj.href]
            //将数据放入数据库
            // sql.commond_insert(insert_commond,insert_commond_params)
            res.write(temp_obj.text+'<br />')
        }
       // --------------------获取到了所有排行版的url--》pageurls--------------------------
       
       ep.after('movielisturl',pageurls.length,(allmovieurls)=>{
       		
       		//这里得到的allmovieurls为28个数组   放到一个临时数组中统一处理
       		const allmovieurls_temp = []

       		allmovieurls.forEach((item)=>{
       			item.forEach((_item)=>{
       				allmovieurls_temp.push(_item)
       			})
       		})
       	
       		let curCount = 0
       		const reptileMove =(url,callback)=>{
       			const delay = parseInt((Math.random()*30000000)%1000,10)
       			
				curCount++;
                console.log('现在的并发数是', curCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒')
                superagent.get(url.toString()).charset('gbk').end((err,sres)=>{
                	if(err){
                		console.log(err)
                		return
                	}

                	if(!isRepeat(url)){
                		const movinfor = moviedetai(sres)
                		catchDate.push(movinfor)
                		console.log(movinfor)
                	}
                	
                })
                setTimeout(function() {
                    curCount--;
                    callback(null, url + 'Call back content');
                }, delay);

       		}

       		async.mapLimit(allmovieurls,5,(url,callback)=>{
       			reptileMove(url, callback)
       		},(err,result)=>{
       			endDate = new Date()
       			console.log('final:')
                console.log(result)

                //统计结果
                res.write('<br/>');
                res.write('<br/>');
                res.write('/**<br/>');
                res.write(' * 爬虫统计结果<br/>');
                res.write('**/<br/>');
                res.write('1、爬虫开始时间：' + startDate + '<br/>');
                res.write('2、爬虫结束时间：' + endDate + '<br/>');
                res.write('3、耗时：' + (endDate - startDate) + 'ms' + ' --> ' + (Math.round((endDate - startDate) / 1000 / 60 * 100) / 100) + 'min <br/>');
                res.end()           
       		})

       })

       	// 轮询 所有排行榜列表页

       	pageurls.forEach((pageurl)=>{
       		superagent.get(pageurl).charset('gbk').end((err,pres)=>{
       			 console.log(`fetch ${pageurl} successful`);
                    res.write(`fetch ${pageurl} successful<br/>`);
       			if(err){
       				console.log(err)
       			}

       			const $ = cheerio.load(pres.text)
       			const detailPageUrls = $('.picList .sTit a')

       			const tempArr = []//临时数组  用于emit发送数据
       			for(let i=0; i<1; i++){//这里改成了1  方便测试；爬区全部排行榜的时候用改成detailPageUrls.length
       				
       				const movieUrl = detailPageUrls.eq(i).attr('href')
       				detailPageUrlsArray.push(movieUrl)
       				tempArr.push(movieUrl)
       			}
       			ep.emit('movielisturl',tempArr)
       			
       		})       		
       	})
    })
    }
}


const start = () => {
    sql.connection.connect((err) => {
        if (err) {
            throw err
        } else {

        }
    })


    http.createServer(onRequest).listen(7777)
}

module.exports = {
    start: start
}
