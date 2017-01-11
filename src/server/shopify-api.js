import Shopify from 'shopify-api-node';
import logError from './log-error.js';

const noop = function(data){
	return data;
};

/**
 * Auth
 *
 * Oauth:
 * 		{
 *		 	'shopName': shop_name,
 *		 	'accessToken': token
 *	 	}
 *
 * Private App:
 * 		{
 *		  	shopName: 'pixafly',
 *		   apiKey: '3ed6e3ec6eff83ab71bb9750ca18467d',
 *		   password: '7b646a123067955c0b73c08778ab9944'
 *		}
 */
const getInstance = (request) => {
	if(!request.session || !request.session.authData){
		return {'error': 'No session object found!'};
	}
	return new Shopify(request.session.authData);
};

/**
 * Store
 *  - only 1 method
 */
const getStore = (shopify, callback) => {
	if(!callback){
		callback = noop;
	}

	return shopify.shop.get({
			fields: ['id', 'name', 'email', 'country', 'currency', 'plan_name', 'myshopify_domain', 'force_ssl']
		})
		.then(store => callback(store))
		.catch(err => {
			logError('shopify', {'getStore': err });
		});
};

/**
 * Collections
 */

/**
 * - getters
 */
const getCollectionById = (shopify, collection_id, number, fields, callback) => {
	if(!callback){
		callback = noop;
	}

	let defaultFields = ['id', 'title', 'products_count', 'collects'];

	return shopify.customCollection.get(collection_id, {
			'limit': number || 10,
			'fields': fields || defaultFields
		})
		.then(collection => callback(collection))
		.catch(err => {
			logError('shopify', err);
		});
};
const getCollectionByName = (shopify, collection_name, fields, callback) => {
	if(!callback){
		callback = noop;
	}

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
};

/**
 *  - setters
 */
const setNewCollectionName = (shopify, collection_name, callback) => {
	if(!shopify){
		return {'error': 'Shopify instance required!'};
	}
	if(!callback){
		callback = noop;
	}

	return shopify.customCollection.create({
			"title": collection_name
		})
		.then(collection => callback(collection))
		.catch(err => {
			logError('shopify', err);
			callback({'error': err});
		});
};
const addProductToCollection = (shopify, collection_id, product_id, callback) => {
	if(!callback){
		callback = noop;
	}

	var collectAlreadyExits = false;
	collection_id = Number(collection_id);
	product_id = Number(product_id);
	/**
	 * Collect link products and custom collections
	 * There is 1 collect for each product->customCollection relationship
	 */
	return shopify.collect.list({
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
};

/**
 * Products
 */

/**
 *  - getters
 */
const getProduct = (shopify, product_id, callback) => {
	return shopify.product.get(product_id)
		.then(product => callback(product))
		.catch(err => {
			logError('shopify', err);
			callback({'error': err});
		});
};
const getProductsCollection = (shopify, collection_id, number, fields, callback) => {
	let defaultFields = ['id'];
	if(!callback){
		callback = noop;
	}

	return shopify.product.list({
			'collection_id': collection_id,
			'limit': number || 10,
			'fields': fields || defaultFields
		})
		.then(list => callback(list))
		.catch(err => {
			logError('shopify', err);
			callback({'error': err});
		});
};

/**
 *  - setters
 */
const setProduct = (shopify, product_options, collectionId, callback) => {
	if(!callback){
		callback = noop;
	}

	return shopify.product.create(product_options)
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
			logError('shopify', {'setProduct': err});
			callback({'error': err});
		});
};

/**
 * Recurring Billing Charge
 */

const getChargeById = (shopify, id) => {
	return shopify.recurringApplicationCharge.get(id, ['status'])
		.then(callback)
		.catch(err => {
			logError('shopify', {'addRecurringCharge': err});
			callback({'error': err});
		});
};

const addRecurringCharge = (shopify, options, callback) => {
	return shopify.recurringApplicationCharge.create(options)
		.then(callback)
		.catch(err => {
			logError('shopify', {'addRecurringCharge': err});
			callback({'error': err});
		});
};

const startRecurringCharge = (shopify, id, params, callback) => {
	return shopify.recurringApplicationCharge.activate(id, params)
		.then(callback)
		.catch(err => {
			logError('shopify', {'startRecurringCharge': err});
			callback({'error': err});
		});
};

var SHAPI = (function(){
	return {
		getInstance: getInstance,
		getStore: getStore,
		getCollectionById: getCollectionById,
		getCollectionByName: getCollectionByName,
		setNewCollectionName: setNewCollectionName,
		addProductToCollection: addProductToCollection,
		getProduct: getProduct,
		getProductsCollection: getProductsCollection,
		setProduct: setProduct
	};
}());

export default SHAPI;
