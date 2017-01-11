import express from 'express';
import bodyParser from 'body-parser';

import * as FBAPI from '../../public/firebase-api.js';
import SHAPI from '../shopify-api.js';

const productsRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const fbCollections = FBAPI.getRef('shopify/collections');
const fbProducts 	= FBAPI.getRef('shopify/products');


productsRouter
	.route('/')
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

productsRouter
	.route('/:name')
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

productsRouter
	.route('/update')
	.post(urlencode, (request, response) => {
		let productId = request.body.product_id;
		//get product dat from Shopify
		SHAPI
			.getProduct(SHAPI.getInstance(request), productId, (product) => {
				FBAPI
					.addData('shopify/products', product, (product_data) => {
						return response.status(200).json([{'updated': product.title}, product_data]);
					});
			});
	});

productsRouter
	.route('/new')
	.post(urlencode, (request, response) => {
		//console.log(request.body);
		let productName = request.body.product_name;
		let collectionId = request.body.collection_id;

		if(!productName){
			return response.status(200).json([{'new': productName}, request.body]);
		}

		let productOptions = {
			"title": productName,
			"metafields": [
		    	{
			        "key": "collection_id",
			        "value": collectionId,
			        "value_type": "string",
			        "namespace": "global"
		     	}
		    ]
		};

		SHAPI.
			setProduct(SHAPI.getInstance(request), productOptions, collectionId, (product) => {
				let status = 201;
				product = !!product ? product : {'error': 'Error something went wrong and we cannot verify if '+productName+' was created.'};
				
				if(product.error){
					status = product.statusCode || 200;
				}

				product['collection_id'] = collectionId;

				fbProducts.push(product);

				response.status(status).json([{'new': productName}, product]);
			});

	});

export default productsRouter;
