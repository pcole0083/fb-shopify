import express from 'express';
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

	.get('/collections', (request, response) => {
		response.redirect(301, '/collection');
	})

	.get('/collection/:name', (request, response) => {
		var name = decodeURIComponent(request.params.name);

		FBAPI
			.listen(fbCollections, 'once', 'value')
			.then((snapshot) => {
				var json = snapshot.exportVal();
				if(!json){
					return response.send('Error getting the collection. Snaposhot is null.');
				}

				var filtered = Object.keys(json).map((key) => {
					let collection = json[key];
					if(collection.title.toLowerCase() !== name.toLowerCase()){
						return false;
					}
					return collection;
				});

				return response.json(filtered);
			});
	})

	.get('/products', (request, response) => {
		FBAPI
			.listen(fbProducts, 'once', 'value')
			.then((snapshot) => {
				var json = snapshot.exportVal();
				if(!json){
					return response.send('Error, could not find any products. Snapshot is null.');
				}

				var products = Object.keys(json).map((key) => {
					let product = json[key];
					return product;
				});

				return response.json(products);
			});
	})

	.get('/products/:collectionName', (request, response) => {
		var collectionName = decodeURIComponent(request.params.collectionName);
		//figure out how to get collection id from the the collectionName then pass it through to products

		FBAPI
			.listen(fbCollections, 'once', 'value')
			.then((snapshot) => {
				var json = snapshot.exportVal();
				if(!json){
					return response.send('Error getting the collection. Snaposhot is null.');
				}

				var col_id = Object.keys(json).map((key) => {
					let collection = json[key];
					if(collection.title.toLowerCase() !== collectionName.toLowerCase()){
						return false;
					}
					return collection.id;
				})[0];

				FBAPI
					.listen(fbProducts, 'once', 'value')
					.then((snapshot) => {
						var json = snapshot.exportVal();
						if(!json){
							return response.send('Error, could not find any products. Snapshot is null.');
						}

						var products = Object.keys(json).map((key) => {
							let product = json[key];

							if(~~product.collection_id !== col_id){
								return false;
							}
							return product;
						});

						return response.json(products);
					});
			});
	});

app.listen(process.argv[2] || 3030, () => {
	var port = process.argv[2] || 3030;
	console.log('Listening on port '+port+'.');
});
