import express from 'express';
import bodyParser from 'body-parser';
import * as FBAPI from '../../public/firebase-api.js';

const sliderRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const creatRefUrl = function(request, extend){
	if(!!request.session.authData.shopName && !!extend){
		return 'shopify/'+request.session.authData.shopName+'/'+extend;
	}
	return null;
};

const getSliders = function(req, res, next){
	res.locals.sliders = [];
	if(!!req.session && !!req.session.authData){
		let fbSliders = FBAPI.getRef(creatRefUrl(req, 'sliders'));
		FBAPI.listen(fbSliders, 'once', 'value')
			.then((snapshot) => {
				if(snapshot.exists() ){
					snapshot.forEach(childSnap => {
						let slider = childSnap.val();
						slider.id = childSnap.key;
						res.locals.sliders.push(slider);
					});
				}
				next();
			});
	}
};

sliderRouter
	.route('/')
	.all(urlencode, getSliders, (request, response) => {
		if(!!request.session && !!request.session.authData){
			//need to check if auth rejected or expired.
			//response.sendFile('slider.html', { root: path.resolve(__dirname, '../../views')});
			FBAPI
				.getData(creatRefUrl(request, 'collections'))
				.then((snapshot) => {
					if( snapshot.exists() ){
						var collections = [];
						snapshot.forEach( (collectionSnap) => {
							collections.push(collectionSnap.val());
						});
					}

					response.render('slider', {
						collections: collections,
						name: 'slider',
						slide_global: {
							types: ['images', 'wysiwyg', 'products']
						},
						sliders: response.locals.sliders,
						num_vids: response.locals.sliders.length
					});
				});
		}
		else {
			response.redirect('./auth');
		}
	});

sliderRouter
	.route('/update/:id')
	.post(urlencode, (request, response) => {
		var opts = request.body;
		let fbSliders = FBAPI.getRef(creatRefUrl(request, 'sliders/'+request.params.id));

		fbSliders.update(opts);
		response.redirect('/slider');
	});

sliderRouter
	.route('/new')
	.post(urlencode, (request, response) => {
		let fbSliders = FBAPI.getRef(creatRefUrl(request, 'sliders'));
		let newVideoOpts = {
			'type': 'hero',
			'collection_id': 0,
			'slides': [
				{
					slide_type: 'image',
					slide_speed: 5,
					slide_position: 0
				}
			]
		};

		fbSliders.push(newVideoOpts);
		response.redirect('/slider');
	});

export default sliderRouter;
