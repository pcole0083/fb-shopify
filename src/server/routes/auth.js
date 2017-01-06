import express from 'express';
import bodyParser from 'body-parser';

import * as FBAPI from '../../public/firebase-api.js';
import SHAPI from '../shopify-api.js';
import SHAUTH from '../shopify-token.js';

const authRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const fbCodes = FBAPI.getRef('shopify/authcodes');

authRouter
	.route('/')
	.get(urlencode, (request, response) => {
		if(!!request.session.shopify){
			//need to check if auth rejected or expired.
			return response.redirect('/');
		}

		let referer = request.headers.referer;
		let hostname = !!referer ? referer.match(/:\/\/(.[^/]+)/)[1] : null;
		//response.status(200).json({'hostname': hostname});

		FBAPI
			.listen(fbCodes, 'once', 'value')
			.then(snapshot => {
				let codes = snapshot.exportVal();
				let authKey = Object.keys(codes).find(key => {
					let authObj = codes[key];
					if(authObj.hostname === hostname){
						return key;
					}
					return false;
				});
				let authData = !!authKey ? codes[authKey] : null;
				if(!authData){
					let authUrl = SHAUTH.getAuthUrl(hostname);
					return response.redirect(authUrl);
				}
				else {
					request.session.shopify = new SHAPI({
						'shopName': authData.shopName,
						'accessToken': authData.access_token
					});
					response.redirect('/');
				}
			});
	});

authRouter
	.route('/complete')
	.get(urlencode, (request, response) => {
		let referer = request.headers.referer;
		let hostname = !!referer ? referer.match(/:\/\/(.[^/]+)/)[1] : null;
		//shopify oauth return data
		//verify the data
		let authData = request.body;
		authData.shopName = hostname;
		fbCodes.push(authData);
		response.redirect('/');
	});

export default authRouter;
