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
	.get( (request, response) => {
		SHAPI
			.getStore((store) => {
				FBAPI
					.addData('shopify/stores', store, () => {
						response.status(200).json(store);
					});
			});
	});

export default storeRouter;
