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
	let store_name = !!request.session.authData ? request.session.authData.shopName : null;
	let ref_path = 'shopify/'+store_name;
	
	SHAPI
		.getStore(SHAPI.getInstance(request))
		.then(store => {
			if(!!store.error){
				console.log("Store");
				console.log(store.error);
			}

			if(!store_name){
				store_name = !!request.session.authData ? request.session.authData.shopName : store.myshopify_domain.replace('.myshopify.com', '');
				ref_path = 'shopify/'+store_name;
			}

			return Promise.all([store, FBAPI.getSnapshotByPath(ref_path+'/store', 'id')]);
		})
		.then(results => {
			console.log(results[0]);
			FBAPI.snapshotUpdate(results[1], results[0]);
			next();
		})
		.catch(err => {
			console.log(err);
			next();
		})
};

billingRouter
	.route('/:name*?')
	.all(setStoreData)
	.get(urlencode, (request, response) => {
		console.log(request.params);
		let params = env_config.billing;
		let reqPrice = request.params['0'].substring(1);

		params.return_url = params.return_url;

		if(!!request.params.name){
			params.name = request.params.name;
		}

		if(!!reqPrice && !isNaN(reqPrice)){
			params.price = Number(reqPrice);
		}

		if(!request.session.ref_path && !!request.session.authData){
			request.session.ref_path = 'shopify/'+request.session.authData.shopName;
		}

		SHAPI.
			addRecurringCharge(SHAPI.getInstance(request), params, (recurring_charge) => {
				if(!!recurring_charge.error){
					response.status(200).json({'error':recurring_charge.error, 'params': params});
				}
				else {
					FBAPI.addData(request.session.ref_path+'/recurring_charges', recurring_charge, () => {
						response.redirect(recurring_charge.confirmation_url);
					});
				}
			});
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
				
				FBAPI.addData(request.session.ref_path+'/recurring_charges', {'id': charge_id, 'status': charge_obj.status});
				
				response.redirect(env_config.baseUrl);
			});
	});

export default billingRouter;

