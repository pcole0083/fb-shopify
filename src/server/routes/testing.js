import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

const testingRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

testingRouter
	.route('/')
	.all((request, response) => {
		if(!!request.session && !!request.session.authData){
			//need to check if auth rejected or expired.
			//response.sendFile('testing.html', { root: path.resolve(__dirname, '../../views')});
			response.render('testing', {});
		}
		else {
			response.redirect('./auth');
		}
	});

export default testingRouter;
