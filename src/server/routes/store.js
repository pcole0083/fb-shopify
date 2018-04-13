import express from 'express';
import bodyParser from 'body-parser';

import * as FBAPI from '../../public/firebase-api.js';
import SHAPI from '../shopify-api.js';

const storeRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const fbCollections = FBAPI.getRef('shopify/collections');
const fbProducts 	= FBAPI.getRef('shopify/products');


storeRouter
	.route('/')
	.all(urlencode, (request, response, next) => {
		if(!!request.session && !!request.session.authData){
			SHAPI
			.getStore(SHAPI.getInstance(request))
			.then(store => {
				if(!store){
					store = [{
						'key': '-2',
						'val': 'No store data'
					}];
				}
				request.session.store = store;
				request.session.error = null;
				next();
			})
			.catch(err => {
				request.session.store = [{
					'key': '-1',
					'val': 'No store data'
				}];
				request.session.error = err;
				next();
			});
		}
		else {
			return response.redirect(302, '/auth');
		}
	})
	.get( (request, response) => {
		response.render('store', {
			'error': request.session.error,
			'name': 'store',
			'store': request.session.store,
			'labels': Object.keys(request.session.store),
			'values': Object.keys(request.session.store).map(function(key){
				return request.session.store[key];
			})
		});
	});

export default storeRouter;
