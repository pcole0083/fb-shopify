import express from 'express';
import bodyParser from 'body-parser';
import * as FBAPI from '../../public/firebase-api.js';
import SHAPI from '../shopify-api.js';

const collectionsRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });
//const fbCollections = FBAPI.getRef('shopify/collections');
const fbProducts = FBAPI.getRef('shopify/products');

const creatRefUrl = function(request, extend){
	if(!!request.session.authData.shopName && !!extend){
		return 'shopify/'+request.session.authData.shopName+extend;
	}
	return null;
};

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

		return response.status(200).json(filtered);
	}
};

collectionsRouter
	.route('/')
	.all( (request, response, next) => {
		if(!request.session.authData){
			response.status(200).json({'error': 'Session not yet established.'});
		}
		else{
			let fbCollections = FBAPI.getRef(creatRefUrl(request, '/collections'));
			request.fbCollections = fbCollections;
			next();
		}
	})
	.get( (request, response) => {
		FBAPI
			.getData(creatRefUrl(request, '/collections'))
			.then((snapshot) => {
				if( snapshot.exists() ){
					var collections = [];
					snapshot.forEach( (collectionSnap) => {
						collections.push(collectionSnap.val());
					});

					response.status(200).json(collections);
				}
				else {
					response.status(200).json({'error': 'No collections exist.'});
				}
			});
	})
	.post(urlencode, (request, response) => {
		if(!request.session.authData){
			return response.status(200).json({'error': 'App not yet instantiated.'});
		}

		let collectionName = request.body.collection_name;

		SHAPI.
			getCollectionByName(SHAPI.getInstance(request), collectionName, null, (collections) => {
				let collection = !!collections.length ? collections[0] : {'error': 'Collection '+collectionName+' not found.'};
				response.status(200).json([{'search': collectionName}, collection]);
			});
	});

collectionsRouter
	.route('/:name')
	.all( (request, response, next) => {
		if(!request.session.authData){
			return response.status(200).json({'error': 'Session not yet established.'});
		}

		request.collectionName = decodeURIComponent(request.params.name);
		next();
	})

	.get( (request, response) => {
		var name = request.collectionName;
		let fbCollections = FBAPI.getRef(creatRefUrl(request, '/collections'));

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

		let fbCollections = FBAPI.getRef(creatRefUrl(request, '/collections'));

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

		let fbProducts = creatRefUrl(request, '/products')

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
					.addData(creatRefUrl(request, '/collections'), {
						'id': collectionId,
						'products_count': collect.position || 1
					});

				FBAPI
					.listen(fbProducts, 'once', 'value')
					.then(function(snapshot){
						if( !!snapshot.exists() ){
							snapshot.forEach( (productSnap) => {
								let product = productSnap.val();
								if(~~product.id === ~~productId){
									productSnap.update({'collection_id': collectionId});
									return truel
								}
							});

							response.status(status).json([{'id': collectionId}, collect]);
						}
						else {
							response.status(status).json([{'id': collectionId}, {'error': 'Product not found.'}]);
						}						
					});
			});

	});

export default collectionsRouter;

