import fs from 'fs';
import mkdirp from 'mkdirp';

function _writeToFile(dirPath, filename, errorData){
	if(!errorData){
		console.warn('No errordata to write to file!');
		process.exit(1);
	}

	if(!dirPath){
		console.warn('No dirPath to write to!');
		process.exit(1);
	}

	var fullFilePath = dirPath+'/'+filename;

	if(typeof errorData == 'object'){
		errorData = JSON.stringify(errorData);
	}

	var typeOfWrite = fs.existsSync(fullFilePath) ? 'write' : 'writeFile';
	
	try{
		fs[typeOfWrite](fullFilePath, errorData+'\n', function(err){
			if(err){
				console.error('_writeToFile: '+err);
				//process.exit(1);
				console.log(filename+' failed to write to file');
			}
			else {
				console.log(filename+' logged successfully');
			}
		});
	}
	catch (error){
		console.error('_writeToFile error: '+error);
	}
}

function mkdir(dir_path, callback){
	const topConstDir = 'logs/';

	if(!dir_path){
		return console.error('Invalid dir_path');
	}

	var dirPath = topConstDir + dir_path;

	mkdirp(dirPath, function(err){
		if(!!err){
			console.error('mkdirp: '+err);
		}
		callback(dirPath);
	});
}

function getDateString(){
	var date = new Date();
	var dateArray = [
		date.getMonth()+1, //getMonth returns 0-11
		date.getDate(),
		date.getFullYear()
	];
	return dateArray.join("-"); 
}

export default function logError(apiName, errorMsg) {
	if(!!errorMsg){
		console.log('error: '+ apiName);
		if(typeof errorMsg !== 'string'){
			console.log('logError: ');
			console.table(errorMsg);
		}
		else {
			console.log('errorMsg: '+ errorMsg);
		}
		mkdir(apiName, (dirPath) => {
			let fileName = 'errors_'+getDateString()+'.log';
			if(typeof dirPath === 'string'){
				_writeToFile(dirPath, fileName, errorMsg);
			}
			else {
				console.log('mkdir error: '+dirPath);
			}
		});
	}
}