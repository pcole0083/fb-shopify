import express from 'express';
import collectionsRouter from './routes/collections.js';
import productsRouter from './routes/products.js';
import configsRouter from './routes/configs.js';

const app = express();

app
	.use(express.static('./'))

	.use('/configs', configsRouter)

	.use('/collections', collectionsRouter)

	.use('/products', productsRouter)

	.listen(process.argv[2] || 3030, () => {
		var port = process.argv[2] || 3030;
		console.log('Listening on port '+port+'.');
	});
