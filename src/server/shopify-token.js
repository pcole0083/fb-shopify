import ShopifyToken from 'shopify-token';
import config from '../config.js';
import logError from './log-error.js';

const env = process.env.NODE_ENV || 'development';
const env_config = config[env];

const store_name = 'pixafly';
const hostname = store_name+'.myshopify.com';

const shopifyToken = new ShopifyToken(env_config.oauth);

const authUrl = shopifyToken.generateAuthUrl(store_name);

shopifyToken.getAccessToken(hostname, code).then((token) => {
  console.log(token);
  // e.g. f85632530bf277ec9ac6f649fc327f17
  // save to Firebase
}).catch((err) => console.err(err));

