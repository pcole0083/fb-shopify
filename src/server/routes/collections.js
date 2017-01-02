import express from 'express';
import bodyParser from 'body-parser';
import * as FBAPI from '../../public/firebase-api.js';
import * as SHAPI from '../shopify-api.js';

const collectionsRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });
const fbCollections = FBAPI.getRef('shopify/collections');

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

		let collectionName = request.body.collection_name;

		SHAPI.
			getCollectionByName(collectionName, null, (collections) => {
				let collection = !!collections.length ? collections[0] : {'error': 'Collection '+collectionName+' not found.'};
				response.json([{'search': collectionName}, collection]);
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
	})

export default collectionsRouter;