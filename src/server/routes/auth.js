import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import Shopify from 'shopify-api-node';

import * as FBAPI from '../../public/firebase-api.js';
import SHAPI from '../shopify-api.js';
import SHAUTH from '../shopify-token.js';

const authRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const fbCodes = FBAPI.getRef('shopify/authcodes');

var verifyShopify = function(request, response, next) {
	//shopify oauth return data
	let queryData = request.query;
	//verify the data
	let verified = SHAUTH.verifyQuery(queryData);

	if(verified){
		next();
	}
	else {
		response.redirect('..');
	}
};

var setShopifySession = function(request, response) {
	let authData = request.authData;

	let shopify = new Shopify({
		shopName: authData.shopName,
		accessToken: authData.accessToken
	});

	request.session.authData = authData;
	request.session.shopify = shopify;

	response.clearCookie('shopname');
	response.cookie('shopname', authData.shopName); //httpOnly - Flags the cookie to be accessible only by the web server.
	
	response.redirect('..');
};

authRouter
	.route('/')
	.all((request, response, next) => {
		if(!!request.session && !!request.session.authData){
			//need to check if auth rejected or expired.
			response.redirect('..');
		}
		else {
			next();
		}
	})
	.get(urlencode, (request, response) => {
		let store_name = !!request.cookies && !!request.cookies.shopname ? request.cookies.shopname : null;
		//console.log(store_name);
		if(!!store_name){
			let authUrl = SHAUTH.getAuthUrl(store_name);
			//console.log(authUrl);
			response.redirect(authUrl);
		}
		else {
			//response.sendFile('auth.html', { root: path.resolve(__dirname, '../../views')});
			response.render('auth', {'name': 'auth'});
		}
	})
	.post(urlencode, (request, response) => {
		let hostname = request.body.store_name;
		//let hostname = !!referer ? referer.match(/:\/\/(.[^/]+)/)[1] : null;
		//response.status(200).json({'hostname': hostname});

		if(!!hostname){
			let authUrl = SHAUTH.getAuthUrl(hostname);
			//console.log(authUrl);
			return response.redirect(authUrl);
		}
		else {
			return response.redirect('..');
		}
	});

authRouter
	.route('/grant')
	.all((request, response, next) => {
		if(!!request.session && !!request.session.authData){
			//need to check if auth rejected or expired.
			response.redirect('..');
		}
		else {
			next();
		}
	})
	.get(urlencode, verifyShopify, (request, response, next) => {
		let queryData = request.query;

		FBAPI
			.listen(fbCodes, 'once', 'value')
			.then(snapshot => {
				let codes = snapshot.exportVal();
				let authKey = Object.keys(codes).find(key => {
					let authObj = codes[key];
					let shopName = queryData.shop.replace('.myshopify.com', '');
					if(authObj.shopName === shopName){
						return key;
					}
					return false;
				});

				let fbData = !!authKey ? codes[authKey] : null;
				//console.log(authKey);

				if(!fbData){
					SHAUTH
						.getAccessToken(queryData.shop, queryData.code, (access_token) =>{
							if(!!access_token.error){
								console.log(access_token.error);
								request.error_obj = access_token.error;
							}
							else {
								let saveData = {
									'accessToken': access_token,
									'shopName': queryData.shop.replace('.myshopify.com', ''),
									'timestamp': queryData.timestamp
								};

								fbCodes.push(saveData);

								request.authData = saveData;
							}
						})
						.then(next);
				}
				else {
					request.authData = fbData;
				}
			})
			.then(next);

	}, setShopifySession);

export default authRouter;
