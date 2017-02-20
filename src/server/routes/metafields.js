import express from 'express';
import bodyParser from 'body-parser';

import SHAPI from '../shopify-api.js';

const metaRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

metaRouter
	.route('*?') //9031585357
	.get( (request, response) => {
		if(!request.params['0']){
			return response.status(200).json({'error': 'Product ID required.'});
		}

		let productId = request.params['0'].substring(1);
		console.log(productId);
		SHAPI
			.getProductMeta(SHAPI.getInstance(request), {'product_id': productId, 'fields': 'metafields'}, (metafields) => {
				return response.status(200).json(metafields);
			});
	});

export default metaRouter;
