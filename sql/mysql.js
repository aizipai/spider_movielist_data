var mysql = require('mysql')

var connection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '123456',
		database: 'movielist',
		port: 3306
	})



module.exports = {
	connection,
	commond_insert: function(insert_commond,insert_commond_params){
		connection.query(insert_commond,insert_commond_params,(err,resinsert)=>{
            	if(err){
            		console.log(111)
            		return
            	}else {
            		console.log(222)
            	}
         })
	}

}

