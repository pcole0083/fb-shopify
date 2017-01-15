import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

const videoRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

videoRouter
	.route('/')
	.all((request, response) => {
		if(!!request.session && !!request.session.authData){
			//need to check if auth rejected or expired.
			response.sendFile('video.html', { root: path.resolve(__dirname, '../../views')});
		}
		else {
			response.redirect('./auth');
		}
	});

export default videoRouter;
