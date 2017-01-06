import ShopifyToken from 'shopify-token';
import config from '../config.js';
import logError from './log-error.js';

const env = process.env.NODE_ENV || 'development';
const env_config = config[env];

const store_name = 'pixafly';
const hostname = store_name+'.myshopify.com';

const shopifyToken = new ShopifyToken(env_config.oauth);

const getShopifyToken = function(){
	return shopifyToken;
};

const getAuthUrl = function(store_name, scope){
	if(!store_name){
		return {'error': 'No store name provided.'};
	}

	if(!scope){
		scope = ['read_products', 'write_products', 'read_script_tags', 'write_script_tags'];
	}

	return shopifyToken.generateAuthUrl(store_name, scope);
}

const verifyQuery = function(query){
	if(!query){
		return {'error': 'No hmac query provided.'};
	}
	return shopifyToken.verifyHmac(query);
}

const getAccessToken = function(hostname, auth_code, callback){
	if(!hostname || !code || !callback){
		return {'error': 'Hostname, auth code, and callback are all required params!'};
	}
	shopifyToken.getAccessToken(hostname, auth_code)
	.then((token) => {
	  // e.g. f85632530bf277ec9ac6f649fc327f17
	  // save to Firebase
	  callback(token);

	}).catch((err) => {
		logError('shopify', err);
		callback({'error': err});
	});
}

const ShAuth = {
	getShopifyToken: getShopifyToken,
	getAuthUrl: getAuthUrl,
	verifyQuery: verifyQuery,
	getAccessToken: getAccessToken
};

export default ShAuth;

