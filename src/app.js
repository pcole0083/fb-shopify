import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import config from './config.js';
import collectionsRouter from './server/routes/collections.js';
import productsRouter from './server/routes/products.js';
import configsRouter from './server/routes/configs.js';
import authRouter from './server/routes/auth.js';
import storeRouter from './server/routes/store.js';
import billingRouter from './server/routes/billing.js';
import testingRouter from './server/routes/testing.js';
import videoRouter from './server/routes/video.js';

const env = process.env.NODE_ENV || 'development';
const env_config = config[env];

const app = express();

//var RedisStore = require('connect-redis')(session);

app
	.use(helmet())
	.use(express.static(__dirname + '/views'))
	.use(express.static(__dirname + '/client'))

	.use(session({
		//store: new RedisStore(),
		secret: env_config.session_secret,
  		resave: false,
  		saveUninitialized: true
	}))

	.use(cookieParser())

	.get('/',function(req,res){
		if(!!request.session && !!request.session.authData){
			return res.sendFile('index.html');
		}
		else {
			return response.redirect(302, '/auth');
			//It will find and locate index.html from views
		}
	})

	.get('/build/client/:name',function(req,res){
		res.sendFile(req.params.name+'.js', {root: __dirname + '/client'} );
		//load the JS file based on the name param.
	})

	.use('/configs', configsRouter)

	.use('/auth', authRouter)

	.use('/testing', testingRouter)

	.use('/store', storeRouter)

	.use('/collections', collectionsRouter)

	.use('/products', productsRouter)

	.use('/billing', billingRouter)

	.use('/video', videoRouter)

	.listen(process.argv[2] || 3030, () => {
		var port = process.argv[2] || 3030;
		console.log('Listening on port '+port+'.');
	});
