import express from 'express';
import * as FBAPI from '../../public/firebase-api.js';

const collectionsRouter = express.Router();
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

collectionsRouter.route('/')
	.get( (request, response) => {
		FBAPI
			.listen(fbCollections, 'once', 'value')
			.then(collectionCallback(null, response));
	});

collectionsRouter.route('/:name')

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