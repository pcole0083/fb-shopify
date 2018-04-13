import express from 'express';
import bodyParser from 'body-parser';

import SHAPI from '../shopify-api.js';

const metaRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

metaRouter
	.route('/') //9031585357
	.all(urlencode, (request, response, next) => {
		if(!!request.session && !!request.session.authData){
			SHAPI
			.getAllMeta(SHAPI.getInstance(request), {})
			.then(metafields => {
				if(!metafields.length){
					metafields = [{
						'namespace': 'NULL',
						'key': 'error',
						'value': 'No metafields found',
						'description': ''
					}];
				}
				request.session.metafields = metafields;
				request.session.error = null;
				next();
			})
			.catch(err => {
				request.session.customers = [{
					'namespace': 'NULL',
					'key': 'error',
					'value': 'No metafields found',
					'description': ''
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
		response.render('metafields', {
			'error': request.session.error,
			'name': 'metafields',
			'metafields': request.session.metafields,
			'labels': Object.keys(request.session.metafields[0]),
			'values': Object.keys(request.session.metafields).map(function(key){
				return request.session.metafields[key];
			})
		});
	});

metaRouter
	.route('/:id') //9031585357
	.get( (request, response) => {
		if(!request.params['0']){
			return response.status(200).json({'error': 'Product ID required.'});
		}

		let productId = request.params['0'].substring(1);
		console.log(productId);
		SHAPI
			.getMetaById(SHAPI.getInstance(request), {'product_id': productId, 'fields': 'metafields'}, (metafields) => {
				return response.status(200).json(metafields);
			});
	});

export default metaRouter;
