import express from 'express';

import config from './config.js';
import collectionsRouter from './server/routes/collections.js';
import productsRouter from './server/routes/products.js';
import configsRouter from './server/routes/configs.js';
import storeRouter from './server/routes/store.js';

const env = process.env.NODE_ENV || 'development';
const env_config = config[env];

const app = express();

app
	.use(express.static('./'))

	.use('/configs', configsRouter)

	.use('/store', storeRouter)

	.use('/collections', collectionsRouter)

	.use('/products', productsRouter)

	.listen(process.argv[2] || 3030, () => {
		var port = process.argv[2] || 3030;
		console.log('Listening on port '+port+'.');
	});
