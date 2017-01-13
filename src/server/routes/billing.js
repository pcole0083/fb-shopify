import express from 'express';
import bodyParser from 'body-parser';

import config from '../../config.js';
import SHAPI from '../shopify-api.js';
import * as FBAPI from '../../public/firebase-api.js';

const env = process.env.NODE_ENV || 'development';
const env_config = config[env];

const billingRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

var setStoreData = function(request, response, next) {
	SHAPI
		.getStore(SHAPI.getInstance(request), (store) => {
			if(!!store.error){
				console.log("Store");
				console.log(store.error);
				next();
			}

			let store_name = !!request.session.authData ? request.session.authData.shopName : store.myshopify_domain.replace('.myshopify.com', '');
			let ref_path = 'shopify/'+store_name;
			//let fbStore = FBAPI.getRef(ref_path);

			FBAPI.addData(ref_path+'/store', store, (returnData) => {
				request.session.ref_path = ref_path;
				next();
			});
		});
};

billingRouter
	.route(['/', '/:name', '/:name/:price'])
	//.all(setStoreData)
	.get(urlencode, setStoreData, (request, response) => {
		let params = env_config.billing;

		params.return_url = params.return_url;

		if(!!request.body.name){
			params.name = request.body.name;
		}

		if(!!request.body.price){
			params.price = request.body.price;
		}

		if(!request.session.ref_path && !!request.session.authData){
			request.session.ref_path = 'shopify/'+request.session.authData.shopName;
		}

		response.redirect(env_config.baseUrl);

		// SHAPI.
		// 	addRecurringCharge(SHAPI.getInstance(request), params, (recurring_charge) => {
		// 		if(!!recurring_charge.error){
		// 			response.status(200).json({'error':recurring_charge.error, 'params': params});
		// 			//response.redirect('..');
		// 		}
		// 		else {
		// 			FBAPI.addData(request.session.ref_path+'/recurring_charges', recurring_charge, () => {
		// 				response.redirect(recurring_charge.confirmation_url);
		// 			});
		// 		}
		// 	});
	});

billingRouter
	.route('/complete')
	.get(urlencode, (request, response) => {
		var charge_id = request.query.charge_id;

		if(!request.session.ref_path && !!request.session.authData){
			request.session.ref_path = 'shopify/'+request.session.authData.shopName;
		}

		SHAPI.
			getChargeById(charge_id, ['status'], (charge_obj) => {
				if(charge_obj.status === 'accepted'){
					FBAPI.addData(request.session.ref_path+'/recurring_charges', {'id': charge_id, 'status': charge_obj.status});
				}
				console.log(env_config.baseUrl);
				//
				response.redirect(env_config.baseUrl);
			});
	});

export default billingRouter;

