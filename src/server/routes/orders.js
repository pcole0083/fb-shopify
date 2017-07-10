import express from 'express';
import bodyParser from 'body-parser';

import * as FBAPI from '../../public/firebase-api.js';
import SHAPI from '../shopify-api.js';

const ordersRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const fbCollections = FBAPI.getRef('shopify/collections');
const fbProducts 	= FBAPI.getRef('shopify/products');


ordersRouter
	.route('/')
	.get( (request, response) => {
		SHAPI
			.getAllOrders(SHAPI.getInstance(request), null, (orders) => {
				//console.log(orders);
				return response.status(200).json(orders);
			});
	});

export default ordersRouter;
