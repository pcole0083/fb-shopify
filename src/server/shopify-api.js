import Shopify from 'shopify-api-node';
import logError from './log-error.js';

const shopify = new Shopify({
  shopName: 'pixafly',
  apiKey: '3ed6e3ec6eff83ab71bb9750ca18467d',
  password: '7b646a123067955c0b73c08778ab9944'
});

export default shopify;

/**
 * User
 */

export const getCurrentUser = (callback) => {
	return shopify.user.current()
	.then(user => callback(user))
	.catch(err => {
		logError('shopify', err);
	});
}

/**
 * Collections
 */

/**
 * - getters
 */

export const getCollectionById = (collection_id, number, fields, callback) => {
	let defaultFields = ['id', 'title', 'products_count', 'collects'];

	return shopify.customCollection.get(collection_id, {
		'limit': number || 10,
		'fields': fields || defaultFields
	})
	.then(collection => callback(collection))
	.catch(err => {
		logError('shopify', err);
	});
}

export const getCollectionByName = (collection_name, fields, callback) => {
	let defaultFields = ['id', 'title', 'products_count'];

	return shopify.customCollection.list({
		'limit': 1,
		'title': collection_name,
		'fields': fields || defaultFields
	})
	.then(collection => callback(collection))
	.catch(err => {
		logError('shopify', err);
		callback({'error': 'Collection Name '+collection_name+' not found.'});
	});
}

/**
 *  - setters
 */

export const setNewCollectionName = (collection_name, callback) => {
	shopify.customCollection.create({
		"title": collection_name
	})
	.then(collection => callback(collection))
	.catch(err => {
		logError('shopify', err);
		callback({'error': err});
	});
}

export const addProductToCollection = (collection_id, product_id, callback) => {
	var collectAlreadyExits = false;
	collection_id = Number(collection_id);
	product_id = Number(product_id);
	/**
	 * Collect link products and custom collections
	 * There is 1 collect for each product->customCollection relationship
	 */
	shopify.collect.list({
		'product_id': product_id,
		'fields': ['id', 'collection_id', 'product_id']
	})
	.then(collects => {
		//console.log(collects);
		let collectKey = Object.keys(collects).find((key) => {
			let clt = collects[key];
			if(clt.collection_id === collection_id){
				collectAlreadyExits = true;
				return key;
			}
			return false;
		});

		let collect = collects[collectKey];

		if(!collectAlreadyExits){
			shopify.collect.create({
				'product_id': product_id,
				'collection_id': collection_id
			})
			.then(collect => callback(collect))
			.catch(err => {
				logError('shopify', err);
				callback({'error': err});
			});
		}
		else {
			callback(collect);
		}
	})
	.catch(err => {
		logError('shopify', err);
		callback({'error': err});
	});
}

/**
 * Products
 */

export const getProductsCollection = (collection_id, number, fields, callback) => {
	let defaultFields = ['id'];

	shopify.product.list({
		'collection_id': collection_id,
		'limit': number || 10,
		'fields': fields || defaultFields
	})
	.then(list => callback(list))
	.catch(err => {
		logError('shopify', err);
		callback({'error': err});
	});
}

/**
 *  - setters
 */

export const setProduct = (product_options, collectionId, callback) => {
	shopify.product.create(product_options)
	.then(product => {
		if(!!collectionId){
			shopify.collect.create({
				'product_id': product.id,
				'collection_id': collectionId
			})
			.then(collect => callback(product))
			.catch(err => {
				logError('shopify', err);
				callback({'error': err});
			})
		}
		else {
			callback(product);
		}
	})
	.catch(err => {
		logError('shopify', err);
		callback({'error': err});
	});

}

