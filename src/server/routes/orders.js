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
	.get(urlencode, (request, response) => {
		if(!!request.session && !!request.session.authData){
			SHAPI
				.getAllOrders(SHAPI.getInstance(request), null, (orders) => {
					//console.log(orders);
					response.render('orders', {
						orders: orders,
						name: 'orders',
						length: orders.length
					});
				});
		}
		else {
			response.redirect('./auth');
		}
	});

export default ordersRouter;
