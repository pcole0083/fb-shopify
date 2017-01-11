import express from 'express';
import bodyParser from 'body-parser';

import SHAPI from '../shopify-api.js';
import * as FBAPI from '../../public/firebase-api.js';

const env = process.env.NODE_ENV || 'development';
const env_config = config[env];

const billingRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

var setStoreData = function(request, response, next) {
	SHAPI
		.getStore(SHAPI.getInstance(request.session.authData), (store) => {
			let store_name = store.myshopify_domain.replace('.myshopify.com', '');
			let ref_path = 'shopify/'+store_name;
			//let fbStore = FBAPI.getRef(ref_path);

			FBAPI.addData(ref_path, store, (returnData) => {
				console.log(returnData);
				request.session.store_name = store_name;
				request.session.ref_path = ref_path;
			})
			.then(next);
		});
};

billingRouter
	.route(['/new', '/new/:name', '/new/:name/:price'])
	.all((request, response, next) => {

		
	})
	.get(urlencode, setStoreData, (request, response) => {
		let params = env_config.billing;
		if(!!request.body.name){
			params.name = request.body.name;
		}

		if(!!request.body.price){
			params.price = request.body.price;
		}

		SHAPI.
			addRecurringCharge(SHAPI.getInstance(request), params, (recurring_charge) => {
				if(!!recurring_charge.error){
					response.redirect('..');
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
		SHAPI.
			getChargeById(charge_id, ['status'], (charge_obj) => {
				if(charge_obj.status === 'accepted'){

				}
			})
		response.redirect('..');
	});


