import fs from 'fs';
import mkdirp from 'mkdirp';

function _writeToFile(dirPath, filename, errorData){
	if(!errorData){
		console.warn('No errordata to write to file!');
		process.exit(1);
	}

	if(typeof errorData == 'object'){
		errorData = JSON.stringify(errorData);
	}

	fs.writeFile(dirPath+'/'+filename, errorData, function(err){
		if(err){
			console.error(err);
			process.exit(1);
		}
		console.log(filename+' logged successfully');
		process.exit();
	});
}

function mkdir(dir_path, callback){
	const topConstDir = 'logs/';

	if(!dir_path){
		return console.error('Invalid dir_path');
	}

	var dirPath = topConstDir + dir_path;

	mkdirp(dirPath, function(err){
		if(!!err){
			console.error(err);
			process.exit(1);
		}
		callback(dirPath);
	});
}

function getDateString(){
	var date = new Date();
	var dateArray = [
		date.getMonth(),
		date.getDate(),
		date.getFullYear(),
		Date.now()
	];
	return dateArray.join("-"); 
}

export default function logError(apiName, errorMsg) {
	mkdir(apiName, (dirPath) => {
		let fileName = 'errors_'+getDateString()+'.log';
		_writeToFile(dirPath, fileName, errorMsg);
	});
}