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
						res.locals.videos.push(childSnap.val());
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
			response.render('video', {
				name: 'video',
				videos: response.locals.videos,
				num_vids: response.locals.videos.length
			});
		}
		else {
			response.redirect('./auth');
		}
	});

export default videoRouter;
