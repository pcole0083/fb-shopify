import fs from 'fs';
import * as child from 'child_process';
import express from 'express';
import bodyParser from 'body-parser';
import * as configJSON from '../../public/firebase.json';

const configsRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

var apiCreds = !!configJSON.apiKey ? configJSON :{
	'apiKey': null,
	'authDomain': null,
	'databaseURL': null
};

var cmd = 'npm run build:client && npm run build:server';

function _writeToFile(dirPath, filename, jsonConfig, callback){
	if(!jsonConfig){
		console.warn('No config data to write to file!');
	}

	if(typeof jsonConfig == 'object'){
		jsonConfig = JSON.stringify(jsonConfig);
	}

	fs.writeFile(dirPath+'/'+filename, jsonConfig, function(err){
		if(err){
			console.error(err);
			callback({'error': err});
		}
		else {
			console.log(filename+' created successfully');
			callback({'success': dirPath+'/'+filename});
		}
	});
}

configsRouter
	.route('/firebase')
	.get((request, response) => {
		if(!!apiCreds.apiKey){
			// FBAPI
			// 	.initializeApp(apiCreds);
			return response.status(200).json(apiCreds);
		}
		return response.status(200).json({"error": "Firebase API not set!"});
	})
	.post(urlencode, (request, response) => {
		let apiKey = !!request.body.apiKey ? request.body.apiKey : null,
			authDomain = !!request.body.authDomain ? request.body.authDomain : null,
			databaseURL = !!request.body.databaseURL ? request.body.databaseURL : null;

		if(!!apiKey && !!authDomain && !!databaseURL){
			apiCreds = {
				'apiKey': apiKey,
				'authDomain': authDomain,
				'databaseURL': databaseURL
			};

			_writeToFile('./src/public', 'firebase.json', apiCreds, function(returnObj) {
				child.exec(cmd, (error, stdout, stderr) => {
				  return console.log(stdout);
				});
				response.status(201).json(apiCreds);
			});
		}
		else {
			response.status(200).json([{'error': 'ApiKey, authDomain, and databaseURL are all required.'}]);
		}
	});

export default configsRouter;