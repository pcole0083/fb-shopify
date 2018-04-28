import express from 'express';
import bodyParser from 'body-parser';
import SHAPI from '../shopify-api.js';

const searchRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const creatRefUrl = function(request, extend){
	if(!!request.session.authData.shopName && !!extend){
		return 'shopify/'+request.session.authData.shopName+'/'+extend;
	}
	return null;
};

const getActiveTheme = function(request, response, next){
	SHAPI.getActiveTheme(SHAPI.getInstance(request)).then(theme => {
		request.theme = theme;
		next();
	});
};

searchRouter
	.route('/')
	.all(urlencode, getActiveTheme, (request, response) => {
		if(!!request.session && !!request.session.authData){
			let theme_name = request.theme.name;
			let store_url = request.session.authData.shopName+'.myshopify.com/admin';
			//need to check if auth rejected or expired.
			SHAPI.getFilteredAssets(SHAPI.getInstance(request), request.theme.id, {}, 'section')
			.then(assets => {
				//response.status(200).json(assets);
				var schemas = assets.map(function(asset){
					var ary = asset.value.split('{% schema %}');
					var schema = JSON.parse(ary[1].replace('{% endschema %}', ''));
					return schema;
				});

				response.render('search', {
					'error': request.session.error,
					'name': 'search',
					'assets': assets,
					'length': assets.length,
					'schemas': schemas,
					'theme_name': theme_name,
					'store_url': store_url
				});
			});
		}
		else {
			response.redirect('./auth');
		}
	});

searchRouter
	.route('/update/:id')
	.post(urlencode, (request, response) => {
		var opts = request.body;
		response.sendStatus(200);
	});

searchRouter
	.route('/new')
	.post(urlencode, (request, response) => {
		let opt = request.body;
		let defaultOpts = {

		};

		response.sendStatus(200);
	});

export default searchRouter;
