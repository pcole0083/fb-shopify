import express from 'express';
import * as FBAPI from '../public/firebase-api.js';
import * as SHAPI from './shopify-api.js';

const collectionId = '401120973';

const fbCollections = FBAPI.getRef('shopify/collections');

/*
SHAPI.
	getCollectionById(collectionId, 10, null, (collection) => {
		FBAPI.addData('shopify/collections', collection);
	});

SHAPI.
	getProductsCollection(collectionId, 10, null, (list) => {
		//console.log(list);
		list.forEach((item) => {
			FBAPI.addData('shopify/products', item);
		});
	});
*/	

const app = express();

app
	.use(express.static('./'))

	.get('/collections', (request, response) => {
		response.redirect(301, '/collection');
	})

	.get('/collection', (request, response) => {
		var blocks = ['fixed', 'movable', 'rotating'];
		
		FBAPI
			.listen(fbCollections, 'once', 'value')
			.then((snapshot) => {
				var json = snapshot.exportVal();
				if(!json){
					return response.send('Error getting the collection. Snaposhot is null.');
				}
				return response.json(Object.keys(json));
			});
	});

app.listen(process.argv[2] || 3030, () => {
	var port = process.argv[2] || 3030;
	console.log('Listening on port '+port+'.');
});
