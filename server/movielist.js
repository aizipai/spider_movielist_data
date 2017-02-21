
const cheerio = require('cheerio')
const superagent = require('superagent-charset')


const originUrl = 'http://kan.2345.com/top/rank.html'
const sql = require('./../sql/mysql.js')



superagent.get(originUrl).charset('gbk').end((err,res)=>{
	if(err){
		console.log(err)
		return
	}

	let pageurls = []//排行榜url


	const $ = cheerio.load(res.text, {decodeEntities: false})
	const pageurls_dome = $('.mt10  a').slice(0,28)
	
	for(let i=0; i<pageurls_dome.length; i++){
		const temp_obj = {}
		temp_obj.href = pageurls_dome.eq(i).attr('href')
		temp_obj.text = pageurls_dome.eq(i).text()
		
		console.log(temp_obj)


	// sql.connection.query('insert into tab_list values(null,'+temp_obj.text+','+temp_obj.text+');',(err,resinsert)=>{
	// 	if(err){
	// 		console.log(err)
	// 		return
	// 	}else {
	// 		console.log(resinsert)
	// 	}
	// })

	}
	// console.log(pageurls)
})

