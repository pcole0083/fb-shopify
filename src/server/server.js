import express from 'express';
import collectionsRouter from './routes/collections.js';
import productsRouter from './routes/products.js';

import * as FBAPI from '../public/firebase-api.js';
import * as SHAPI from './shopify-api.js';

const collectionId = '401120973';

const fbCollections = FBAPI.getRef('shopify/collections');
const fbProducts 	= FBAPI.getRef('shopify/products');

/*
SHAPI.
	getCollectionById(collectionId, 10, null, (collection) => {
		FBAPI.addData('shopify/collections', collection);
	});
*/
/*SHAPI.
	getProductsCollection(collectionId, 10, null, (list) => {
		//console.log(list);
		list.forEach((item) => {
			item['collection_id'] = collectionId;

			FBAPI
				.addData('shopify/products/', item);
		});
	});*/
	

const app = express();

app
	.use(express.static('./'))

	.use('/collections', collectionsRouter)

	.use('/products', productsRouter)

	.listen(process.argv[2] || 3030, () => {
		var port = process.argv[2] || 3030;
		console.log('Listening on port '+port+'.');
	});
