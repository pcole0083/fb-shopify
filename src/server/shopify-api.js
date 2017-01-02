import Shopify from 'shopify-api-node';
import logError from './log-error.js';

const shopify = new Shopify({
  shopName: 'pixafly',
  apiKey: '3ed6e3ec6eff83ab71bb9750ca18467d',
  password: '7b646a123067955c0b73c08778ab9944'
});

export default shopify;

/**
 * Collections
 */

/**
 * - getters
 */

export const getCollectionById = (collection_id, number, fields, callback) => {
	let defaultFields = ['id', 'title', 'products_count'];

	shopify.customCollection.get(collection_id, {
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

	shopify.customCollection.list({
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

export const setProduct = (product_options, callback) => {
	shopify.product.create(product_options)
	.then(collection => callback(collection))
	.catch(err => {
		logError('shopify', err);
		callback({'error': err});
	});
}

