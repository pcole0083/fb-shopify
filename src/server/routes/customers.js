import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import SHAPI from '../shopify-api.js';

const customersRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

customersRouter
	.route('/')
	.all(urlencode, (request, response, next) =>{
		if(!!request.session && !!request.session.authData){
			SHAPI
				.getCustomerList(SHAPI.getInstance(request), {})
				.then(customers => {
					if(!customers.length){
						customers = [{
							'id': '-1',
							'first_name': 'No customers found',
							'email': 'N/A'
						}];
					}
					request.session.customers = customers;
					request.session.error = null;
					next();
				})
				.catch(err => {
					request.session.customers = [{
						'id': '-1',
						'first_name': 'No customers found',
						'email': 'N/A'
					}];
					request.session.error = err;
					next();
				});
		}
		else {
			return response.redirect(302, '/auth');
		}
	})
	.get( (request, response) => {
		response.render('customers', {
			'error': request.session.error,
			'name': 'customers',
			'customers': request.session.customers
		});
	});

customersRouter
	.route('/customer')
	.post(urlencode, (request, response) => {
		if(!!request.session && !!request.session.authData){
			let _id = request.body.id;
			SHAPI
			.getCustomerById(SHAPI.getInstance(request), _id)
				.then(customer => {
					return response.status(200).json(customer);
				})
				.catch(err => {
					return response.status(200).json(err);
				});
		}
		else {
			return response.redirect(302, '/auth');
		}
	});

customersRouter
	.route('/meta')
	.get(urlencode, (request, response) => {
		let _id = request.query.id;
		if(!!_id){
			SHAPI
				.getCustomerMeta(SHAPI.getInstance(request), parseInt(_id, 10))
				.then(metafields => {
					return response.status(200).json(metafields);
				})
				.catch(err => {
					return response.status(200).json(err);
				});
		}
		else {
			return Promise.all([{'error': 'ID is required'}]);
		}
	});

customersRouter
	.route('/meta/update')
	.post(urlencode, (request, response, next) => {
		let _id = Number(request.body.id);
		let namespace = request.body.namespace;
		let key = request.body.key;
		let value = request.body.value;
		let description = request.body.description;

		let data = {
			"namespace": namespace,
			"key": key,
			"value": value,
			"value_type": "string",
			"description": description
		};

		SHAPI
			.setCustomerMeta(SHAPI.getInstance(request), _id, data)
			.then(metafield => {
				return response.status(200).json(metafield);
			})
			.catch(err => {
					return response.status(200).json(err);
			});
	});

customersRouter
	.route('/customer/email')
	.post(urlencode, (request, response) => {
		let email = request.body.email;
		SHAPI.getCustomerByEmail(SHAPI.getInstance(request), email, { 'email': email, 'limit': 1 }, (customers) => {
			let customer = customers[0];
			return response.status(200).json(customer);
		});
	});

customersRouter
	.route('/customer/update')
	.post(urlencode, (request, response, next) => {
		let id = Number(request.body.id);
		let new_email = request.body.new_email;

		SHAPI.getCustomerByEmail(SHAPI.getInstance(request), new_email, { 'email': new_email, 'limit': 1}, (customers) => {
			let customer = customers[0];
			if(!!customer && customer.id !== id){
				return response.status(200).json({'error': 'This email is already in use.'});
			}
			else {
				next();
			}
		});
	}, (request, response) => {
		let id = Number(request.body.id);
		let new_email = request.body.new_email;
		var update_data = {
			"id": id,
			"email": new_email,
			"note": "Customer updated via API."
		}; //add old email to meta_data?
		console.log('Stil made it');
		SHAPI.updateCustomer(SHAPI.getInstance(request), id, update_data, (data) => {
			return response.status(200).json(data);
		});
	});

export default customersRouter;
