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
 *		   shopName: 'pixafly',
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

const noInstance = {'error': 'Instance of Shopify not found'};

/**
 * Store
 *  - only 1 method
 */
const getStore = (shopify, callback) => {
	if(!shopify){
		return noInstance;
	}

	if(!callback){
		callback = noop;
	}

	return shopify.shop.get({
			fields: ['id', 'name', 'email', 'address1', 'address2', 'city', 'zip', 'country', 'currency', 'plan_name', 'myshopify_domain', 'force_ssl']
		})
		.then(store => callback(store))
		.catch(err => {
			logError('shopify', {'getStore': err});
			callback({'error': err});
		});
};

/**
 * Collections
 */

/**
 * - getters
 */
const getCollectionById = (shopify, collection_id, number, fields, callback) => {
	if(!shopify){
		return noInstance;
	}

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
	if(!shopify){
		return noInstance;
	}

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
		return noInstance;
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
	if(!shopify){
		return noInstance;
	}

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
	if(!shopify){
		return noInstance;
	}

	return shopify.product.get(product_id)
		.then(product => callback(product))
		.catch(err => {
			logError('shopify', err);
			callback({'error': err});
		});
};
const getProductsCollection = (shopify, collection_id, number, fields, callback) => {
	if(!shopify){
		return noInstance;
	}

	if(!callback){
		callback = noop;
	}

	let defaultFields = ['id'];
	
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
	if(!shopify){
		return noInstance;
	}

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
 * Theme
 */

const getActiveTheme = (shopify) => {
	if(!shopify){
		return noInstance;
	}

	return shopify.theme.list({'limit': 10})
		.then(themes => {
			return themes.find(theme => {
				return theme.role === 'main';
			});
		})
		.catch(err => {
			logError('shopify', {'getActiveTheme': err});
			callback({'error': err});
		});
};

const getThemeById = (shopify, id, callback) => {
	if(!shopify){
		return noInstance;
	}

	if(!callback){
		callback = noop;
	}

	return shopify.theme.get(id)
		.then(theme => {
			return callback(theme);
		})
		.catch(err => {
			logError('shopify', {'getThemeById': err});
			callback({'error': err});
		});
};

/**
 * Assets
 */

/**
 * [description]
 * @param  {[type]}   shopify  [description]
 * @param  {Number}   theme_id e.g. 828155753
 * @param  {STRING path}   key      e.g. 'templates/index.liquid'
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
const getSingleAsset = (shopify, theme_id, key, callback) => {
	if(!shopify){
		return noInstance;
	}

	if(!callback){
		callback = noop;
	}

	return shopify.asset.get(theme_id, {
			'asset': { key: key },
			'theme_id': +theme_id //cast to Number or NaN
		})
		.then(asset => {
			return callback(asset);
		})
		.catch(err => {
			logError('shopify', {'getSingleAsset': err});
			callback({'error': err});
		});
};

const getFilteredAssets = (shopify, theme_id, params, filter, callback) => {
	if(!shopify){
		return noInstance;
	}

	if(!callback){
		callback = noop;
	}

	return shopify.asset.list(theme_id, params)
		.then(assets => {
			let fetchedAssets = assets.filter(asset => {
				return !!~asset.key.indexOf(filter); //return true if /search exists in the string
			});

			let filteredAssets = fetchedAssets.map(asset => {
				return getSingleAsset(shopify, theme_id, asset.key);
			});

			return Promise.all(filteredAssets);
		})
		.catch(err => {
			logError('shopify', {'getSingleAsset': err});
			callback({'error': err});
		});
};


const setSearchAsset = (shopify, theme_id, params, callback) => {
	if(!shopify){
		return noInstance;
	}

	if(!callback){
		callback = noop;
	}

	return shopify.asset.update(theme_id, params)
		.then(asset => {
			callback(asset);
		})
		.catch(err => {
			logError('shopify', {'setSearchAsset': err});
			callback({'error': err});
		});
};

/**
 * Recurring Billing Charge
 */

const getChargeById = (shopify, id) => {
	if(!shopify){
		return noInstance;
	}

	return shopify.recurringApplicationCharge.get(id, ['status'])
		.then(callback)
		.catch(err => {
			logError('shopify', {'addRecurringCharge': err});
			callback({'error': err});
		});
};

const addRecurringCharge = (shopify, options, callback) => {
	if(!shopify){
		return noInstance;
	}

	return shopify.recurringApplicationCharge.create(options)
		.then(callback)
		.catch(err => {
			logError('shopify', {'addRecurringCharge': err});
			callback({'error': err});
		});
};

const startRecurringCharge = (shopify, id, params, callback) => {
	if(!shopify){
		return noInstance;
	}

	return shopify.recurringApplicationCharge.activate(id, params)
		.then(callback)
		.catch(err => {
			logError('shopify', {'startRecurringCharge': err});
			callback({'error': err});
		});
};

const getAllOrders = (shopify, params, callback) => {
	if(!shopify){
		return noInstance;
	}

	if(!params){
		params = {
			'updated_at_min': "2016-12-31 23:59:59 GTM -05:00"
		};
	}

	return shopify.order.list(params)
		.then(orders => {
			if(!!callback){
				callback(orders);
			}
		})
		.catch(err => {
			logError('shopify', {'getAllOrders': err});
			callback({'error': err});
		});
};

const getProductMeta = (shopify, params, callback) => {
	if(!shopify){
		return noInstance;
	}

	if(!params){
		return {'error': "Error no params"};
	}

	return shopify.metafield.get(params)
		.then(metafields => {
			if(!!callback){
				callback(metafields);
			}
		})
		.catch(err => {
			logError('shopify', {'getProductMeta': err});
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
		setProduct: setProduct,
		getChargeById: getChargeById,
		addRecurringCharge: addRecurringCharge,
		startRecurringCharge: startRecurringCharge,
		getActiveTheme: getActiveTheme,
		getThemeById: getThemeById,
		getSingleAsset: getSingleAsset,
		getFilteredAssets: getFilteredAssets,
		setSearchAsset: setSearchAsset,
		getAllOrders: getAllOrders,
		getProductMeta: getProductMeta
	};
}());

export default SHAPI;
