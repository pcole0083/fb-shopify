import Shopify from 'shopify-api-node';
import logError from './log-error.js';

const noop = function(data){
	return data;
};

const noInstance = {'error': 'Instance of Shopify not found'};

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
	//console.log(request.session.sp_instance);
	if(!request.session || !request.session.authData){
		return noInstance;
	}
	
	request.session.sp_instance = new Shopify(request.session.authData);
	return request.session.sp_instance;
};



/**
 * Store
 *  - only 1 method
 */
const getStore = (shopify, callback) => {
	if(!shopify){
		return noInstance;
	}
	return shopify.shop.get({
			fields: ['id', 'name', 'email', 'address1', 'address2', 'city', 'zip', 'country', 'currency', 'plan_name', 'myshopify_domain', 'force_ssl']
		})
		.then(store => {
			if(!!callback){
				return callback(store);
			}
			return store;
		})
		.catch(err => {
			logError('shopify', {'getStore': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
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
		.then(collection => {
			return callback(collection);
		})
		.catch(err => {
			logError('getCollectionById', err);
			return callback({'error': 'Collection ID '+collection_id+' not found.'});
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
		.then(collection => {
			return callback(collection);
		})
		.catch(err => {
			logError('getCollectionByName', err);
			return callback({'error': 'Collection Name '+collection_name+' not found.'});
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
		.then(collection => {
			return callback(collection);
		})
		.catch(err => {
			logError('shopify', err);
			return callback({'error': err});
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
			return callback({'error': err});
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
		.then(product => {
			if(!!callback){
				return callback(product);
			}
			return product;
		})
		.catch(err => {
			logError('shopify', err);
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

const getAllProducts = async (shopify, params) => {
	if(!shopify){
		return Promise.all([noInstance]);
	}

	if(!params){
		params = {};
	}

	var promises = [];
	var products_list = [];
	var pageLimit = 250;
	var productsCount = await shopify.product.count();

	var loops = productsCount > pageLimit ? Math.ceil(productsCount/pageLimit) : productsCount;
	
	for (let i = 1; i <= loops; i++) {
		let productsChunk = shopify.product.list({
			limit: pageLimit,
			page: i
		}).then(products => {
			products_list = products_list.concat(products);
			return products;
		})
		.catch(err => {
			logError('getAllProducts', err);
			return Promise.all([{'error': err}]);
		});
		promises.push(productsChunk);
	}
	await Promise.all(promises);

	return products_list;
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
				return shopify.collect.create({
					'product_id': product.id,
					'collection_id': collectionId
				})
				.then(product => {
					return callback(product);
				})
				.catch(err => {
					logError('shopify', err);
					callback({'error': err});
				})
			}
			else {
				return callback(product);
			}
		})
		.catch(err => {
			logError('shopify', {'setProduct': err});
			return callback({'error': err});
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
			return callback({'error': err});
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
			return callback({'error': err});
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
			return callback({'error': err});
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
			logError('shopify', {'getFilteredAssets': err});
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
			if(!!callback){
				return callback(asset);
			}
			return asset;
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
		.then(charge => {
			if(!!callback){
				return callback(charge);
			}
			return charge;
		})
		.catch(err => {
			logError('shopify', {'addRecurringCharge': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

const addRecurringCharge = (shopify, options, callback) => {
	if(!shopify){
		return noInstance;
	}

	return shopify.recurringApplicationCharge.create(options)
		.then(charge => {
			if(!!callback){
				return callback(charge);
			}
			return charge;
		})
		.catch(err => {
			logError('shopify', {'addRecurringCharge': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

const startRecurringCharge = (shopify, id, params, callback) => {
	if(!shopify){
		return noInstance;
	}

	return shopify.recurringApplicationCharge.activate(id, params)
		.then(charge => {
			if(!!callback){
				return callback(charge);
			}
			return charge;
		})
		.catch(err => {
			logError('shopify', {'startRecurringCharge': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

/**
 * Orders
 */
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
				return callback(orders);
			}
			return orders;
		})
		.catch(err => {
			logError('shopify', {'getAllOrders': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

/**
 * MetaFields
 */
const getAllMeta = (shopify, params, callback) => {
	if(!shopify){
		return Promise.all(noInstance);
	}

	if(!params){
		return Promise.all([{'error': "Error no params"}]);
	}

	return shopify.metafield.list(params)
		.then(metafields => {
			if(!!callback){
				return callback(metafields);
			}
			return metafields;
		})
		.catch(err => {
			logError('shopify', {'getAllMeta': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

const getMetaByType = (shopify, params, callback) => {
	if(!shopify || !shopify.metafield){
		return Promise.all(noInstance);
	}

	if(!params){
		return Promise.all([{'error': "Invalid type or params"}]);
	}

	return shopify.metafield.list(params)
		.then(metafields => {
			if(!!callback){
				return callback(metafields);
			}
			return metafields;
		})
		.catch(err => {
			logError('shopify', {'getMetaByType': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

const getMetaById = (shopify, id, params, callback) => {
	if(!shopify){
		return Promise.all(noInstance);
	}

	if(!id || !params){
		return Promise.all([{'error': "Invalid id or params"}]);
	}

	return shopify.metafield.get(id, params)
		.then(metafields => {
			if(!!callback){
				callback(metafields);
			}
		})
		.catch(err => {
			logError('shopify', {'getMetaById': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

/**
 * Customer
 */
const getCustomerList = (shopify, email, params, callback) => {
	if(!shopify){
		return Promise.all(noInstance);
	}
	return shopify.customer.list(params)
		.then(customers => {
			if(!!callback){
				return callback(customers);
			}
			return customers;
		})
		.catch(err => {
			logError('shopify', {'getCustomerList': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

const getCustomerById = (shopify, id, params, callback) => {
	if(!shopify){
		return Promise.all(noInstance);;
	}

	if(!id || !params){
		return Promise.all([{'error': "Invalid id or params"}]);
	}

	return shopify.customer.get(id, params)
		.then(customer => {
			if(!!callback){
				return callback(customer);
			}
			return customer;
		})
		.catch(err => {
			logError('shopify', {'getCustomerById': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

const getCustomerMeta = (shopify, id, callback) => {
	if(!shopify){
		return Promise.all(noInstance);;
	}

	if(!id){
		return Promise.all([{'error': "Invalid id"}]);
	}

	const url = shopify.customer.buildUrl(`${id}/metafields`);
	
	return shopify.request(url, 'GET', 'metafields')
		.then(customer => {
			if(!!callback){
				return callback(customer);
			}
			return customer;
		})
		.catch(err => {
			logError('shopify', {'getCustomerMeta': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
		});
};

const getCustomerByEmail = (shopify, email, params, callback) => {
	if(!shopify){
		return noInstance;
	}
	return shopify.customer.list(params)
		.then(customers => {
			if(!!callback){
				callback(customers);
			}
		})
		.catch(err => {
			logError('shopify', {'getCustomerByEmail': err});
			if(!!callback){
				callback({'error': err});
			}
		});
};

const updateCustomer = (shopify, id, params, callback) => {
	if(!shopify){
		return noInstance;
	}

	shopify.customer.update(id, params)
		.then(customer => {
			if(!!callback){
				callback(customer);
			}
		})
		.catch(err => {
			logError('shopify', {'updateCustomer': err});
			if(!!callback){
				callback({'error': err});
			}
		});
};

const setCustomerMeta = (shopify, id, data, callback) => {
	if(!shopify){
		return Promise.all(noInstance);;
	}

	if(!id){
		return Promise.all([{'error': "Invalid id"}]);
	}

	
	if(!data){
		return Promise.all([{'error': "Mising data to add"}]);
	}

	const url = shopify.customer.buildUrl(`${id}/metafields`);

	return shopify.request(url, 'POST', 'metafield', data)
		.then(metafield => {
			if(!!callback){
				return callback(metafield);
			}
			return metafield;
		})
		.catch(err => {
			logError('shopify', {'setCustomerMeta': err});
			if(!!callback){
				return callback({'error': err});
			}
			return {'error': err};
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
		getAllProducts: getAllProducts,
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
		getAllMeta: getAllMeta,
		getMetaById: getMetaById,
		getMetaByType: getMetaByType,
		getCustomerList: getCustomerList,
		getCustomerById: getCustomerById,
		getCustomerByEmail: getCustomerByEmail,
		updateCustomer: updateCustomer,
		getCustomerMeta: getCustomerMeta,
		setCustomerMeta: setCustomerMeta
	};
}());

export default SHAPI;
