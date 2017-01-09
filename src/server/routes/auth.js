import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

import * as FBAPI from '../../public/firebase-api.js';
import SHAPI from '../shopify-api.js';
import SHAUTH from '../shopify-token.js';

const authRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const fbCodes = FBAPI.getRef('shopify/authcodes');

var setShopifySession = function(session, authData) {
	return session.shopify = new SHAPI({
		'shopName': authData.shopName,
		'accessToken': authData.accessToken
	});
};

authRouter
	.route('/')
	.get(urlencode, (request, response) => {
		if(!!request.session && !!request.session.shopify){
			//need to check if auth rejected or expired.
			return response.redirect('..');
		}

		let store_name = !!request.headers && !!request.headers.referer ? request.headers.referer.match(/:\/\/(.[^/]+)/)[1] : null;
		if(!!store_name){
			reponse.redirect(307, {'store_name': store_name});
		}

		response.sendFile('auth.html', { root: path.resolve(__dirname, '../../views')});
	})
	.post(urlencode, (request, response) => {
		if(!!request.session && !!request.session.shopify){
			//need to check if auth rejected or expired.
			return response.redirect('/');
		}

		let hostname = request.body.store_name;
		//let hostname = !!referer ? referer.match(/:\/\/(.[^/]+)/)[1] : null;
		//response.status(200).json({'hostname': hostname});

		if(!!hostname){
			let authUrl = SHAUTH.getAuthUrl(hostname);
			//console.log(authUrl);
			return response.redirect(authUrl);
		}
		else {
			return response.redirect('/');
		}
	});

authRouter
	.route('/grant')
	.get(urlencode, (request, response) => {
		//shopify oauth return data
		let queryData = request.query;
		//verify the data
		let verified = SHAUTH.verifyQuery(queryData);
		
		if(verified){
			FBAPI
				.listen(fbCodes, 'once', 'value')
				.then(snapshot => {
					let codes = snapshot.exportVal();
					let authKey = Object.keys(codes).find(key => {
						let authObj = codes[key];
						if(authObj.shopName === queryData.shop){
							return key;
						}
						return false;
					});

					let fbData = !!authKey ? codes[authKey] : null;
					//console.log(fbData);

					if(!fbData){
						SHAUTH
							.getAccessToken(queryData.shop, queryData.code, (access_token) =>{
								if(!!access_token.error){
									return console.log(access_token.error);
								}

								let saveData = {
									'accessToken': access_token,
									'shopName': queryData.shop,
									'timestamp': queryData.timestamp
								};

								fbCodes.push(saveData);

								setShopifySession(request.session, saveData);
								return response.redirect('..');
							});
					}
					else {
						setShopifySession(request.session, fbData);
						return response.redirect('..');
					}
				});

		}
		else {
			response.redirect('/auth');
		}
	});

export default authRouter;
