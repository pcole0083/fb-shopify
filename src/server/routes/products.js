import express from 'express';
import * as FBAPI from '../../public/firebase-api.js';

const productsRouter = express.Router();
const fbCollections = FBAPI.getRef('shopify/collections');
const fbProducts 	= FBAPI.getRef('shopify/products');

productsRouter.route('/')
	.get( (request, response) => {
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
	});

productsRouter.route('/:name')

	.all( (request, response, next) => {
		request.collectionName = decodeURIComponent(request.params.name);
		next();
	})

	.get( (request, response) => {
		var collectionName = request.collectionName;

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

export default productsRouter;