import express from 'express';
import bodyParser from 'body-parser';
import * as FBAPI from '../../public/firebase-api.js';
import SHAPI from '../shopify-api.js';

const collectionsRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });
const fbCollections = FBAPI.getRef('shopify/collections');
const fbProducts = FBAPI.getRef('shopify/products');

const collectionCallback = function(name, response) {
	name = !!name ? name.toLowerCase() : null;

	return (snapshot) => {
		var json = snapshot.exportVal();
		if(!json){
			return response.send('Error getting the collection. Snapshot is null.');
		}

		var filtered = Object.keys(json).map((key) => {
			let collection = json[key];
			if(!!name && (collection.title.toLowerCase() !== name) ){
				return false;
			}
			return collection;
		});

		return response.json(filtered);
	}
};

collectionsRouter
	.route('/')
	.get( (request, response) => {
		FBAPI
			.listen(fbCollections, 'once', 'value')
			.then(collectionCallback(null, response));
	})
	.post(urlencode, (request, response) => {
		if(!request.session.authData){
			return response.status(200).json({'error': 'Shopify not yet instantiated.'});
		}

		let collectionName = request.body.collection_name;

		SHAPI.
			getCollectionByName(SHAPI.getInstance(request), collectionName, null, (collections) => {
				let collection = !!collections.length ? collections[0] : {'error': 'Collection '+collectionName+' not found.'};
				response.status(200).json([{'search': collectionName}, collection]);
				// if(!!collection && !collection.error){
				// 	FBAPI.addData('shopify/collections', collection);
				// }
			});
	});

collectionsRouter
	.route('/:name')
	.all( (request, response, next) => {
		request.collectionName = decodeURIComponent(request.params.name);
		next();
	})

	.get( (request, response) => {
		var name = request.collectionName;

		FBAPI
			.listen(fbCollections, 'once', 'value')
			.then(collectionCallback(name, response));
	});

collectionsRouter
	.route('/new')
	.post(urlencode, (request, response) => {
		if(!request.session.authData){
			return response.status(200).json({'error': 'Shopify not yet instantiated.'});
		}
		//console.log(request.body);
		let collectionName = request.body.collection_name_new;

		if(!collectionName){
			return response.status(200).json([{'new': collectionName}, request.body]);
		}

		SHAPI.
			setNewCollectionName(SHAPI.getInstance(request), collectionName, (collection) => {
				let status = 201;
				collection = !!collection ? collection : {'error': 'Error something went wrong and we cannot verify if '+collectionName+' was created.'};
				
				if(collection.error){
					status = collection.statusCode || 200;
				}

				fbCollections.push({
					'id': collection.id,
					'title': collection.title,
					'products_count': 0
				});

				response.status(status).json([{'new': collectionName}, collection]);
			});

	});

collectionsRouter
	.route('/add')
	.post(urlencode, (request, response) => {
		if(!request.session.authData){
			return response.status(200).json({'error': 'Shopify not yet instantiated.'});
		}

		let collectionId = request.body.collection_id;
		let productId = request.body.product_id;

		if(!collectionId || !productId){
			return response.status(200).json([{'id': collectionId}, request.body]);
		}

		SHAPI.
			addProductToCollection(SHAPI.getInstance(request), collectionId, productId, (collect) => {
				let status = 200;
				collect = !!collect ? collect : {'error': 'Error something went wrong and we cannot verify if '+productId+' was moved to '+collectionId+'.'};
				//console.log(collect);
				if(!!collect.error){
					status = collect.statusCode || 200;
					return response.status(status).json([{'id': collectionId}, collect.error]);
				}

				FBAPI
					.addData('shopify/collection', {
						'id': collectionId,
						'products_count': collect.position || 1
					});

				FBAPI
					.listen(fbProducts, 'once', 'value')
					.then(function(snapshot){
						let json = snapshot.exportVal();
						let productKey = Object.keys(json).find((key) =>{
							let product = json[key];
							if(~~product.id === ~~productId){
								return key;
							}
							return false;
						});
						
						//if product was made in Shopify Admin, need to add it to FB now
						if(!!productKey){
							let np_ref = FBAPI.getRef('shopify/products/'+productKey);
							np_ref.update({'collection_id': collectionId});
						}

						response.status(status).json([{'id': collectionId}, collect]);
					});
			});

	});

export default collectionsRouter;

