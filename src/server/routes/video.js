import express from 'express';
import bodyParser from 'body-parser';
import * as FBAPI from '../../public/firebase-api.js';

const videoRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

const creatRefUrl = function(request, extend){
	if(!!request.session.authData.shopName && !!extend){
		return 'shopify/'+request.session.authData.shopName+'/'+extend;
	}
	return null;
};

const getVideos = function(req, res, next){
	res.locals.videos = [];
	if(!!req.session && !!req.session.authData){
		let fbVideos = FBAPI.getRef(creatRefUrl(req, 'videos'));
		FBAPI.listen(fbVideos, 'once', 'value')
			.then((snapshot) => {
				if(snapshot.exists() ){
					snapshot.forEach(childSnap => {
						let video = childSnap.val();
						video.id = childSnap.key;
						res.locals.videos.push(video);
					});
				}
				next();
			});
	}
};

videoRouter
	.route('/')
	.all(urlencode, getVideos, (request, response) => {
		if(!!request.session && !!request.session.authData){
			//need to check if auth rejected or expired.
			//response.sendFile('video.html', { root: path.resolve(__dirname, '../../views')});
			FBAPI
				.getData(creatRefUrl(request, 'collections'))
				.then((snapshot) => {
					if( snapshot.exists() ){
						var collections = [];
						snapshot.forEach( (collectionSnap) => {
							collections.push(collectionSnap.val());
						});
					}

					response.render('video', {
						collections: collections,
						name: 'video',
						videos: response.locals.videos,
						num_vids: response.locals.videos.length
					});
				});
		}
		else {
			response.redirect('./auth');
		}
	});

videoRouter
	.route('/update/:id')
	.post(urlencode, (request, response) => {
		var opts = request.body;
		let fbVideos = FBAPI.getRef(creatRefUrl(request, 'videos/'+request.params.id));

		fbVideos.update(opts);
		response.redirect('/video');
	});

videoRouter
	.route('/new')
	.post(urlencode, (request, response) => {
		let fbVideos = FBAPI.getRef(creatRefUrl(request, 'videos'));
		let newVideoOpts = {
			'type': 'youtube',
			'collection_id': 0,
			'video_id': 0
		};

		fbVideos.push(newVideoOpts);
		response.redirect('/video');
	});

export default videoRouter;
