import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import SHAPI from '../shopify-api.js';

const testingRouter = express.Router();
const urlencode = bodyParser.urlencoded({ extended: false });

testingRouter
	.route('/')
	.all((request, response) => {
		if(!!request.session && !!request.session.authData){
			//need to check if auth rejected or expired.
			//response.sendFile('testing.html', { root: path.resolve(__dirname, '../../views')});
			return response.render('testing', {
				'name': 'testing'
			});
		}
		else {
			return response.redirect(302, '/auth');
		}
	});

testingRouter
	.route('/customer')
	.post(urlencode, (request, response) => {
		let _id = request.body.id;
		SHAPI.getCustomerById(SHAPI.getInstance(request), _id)
			.then(customer => {
				return response.status(200).json(customer);
			});
	});

testingRouter
	.route('/customer/email')
	.post(urlencode, (request, response) => {
		let email = request.body.email;
		SHAPI.getCustomerByEmail(SHAPI.getInstance(request), email, { 'email': email, 'limit': 1 }, (customers) => {
			let customer = customers[0];
			return response.status(200).json(customer);
		});
	});

testingRouter
	.route('/customer/update')
	.post(urlencode, (request, response, next) => {
		let id = Number(request.body.id);
		let new_email = request.body.new_email;

		SHAPI.getCustomerByEmail(SHAPI.getInstance(request), new_email, { 'email': new_email, 'limit': 1}, (customers) => {
			let customer = customers[0];
			//console.log(customer.id);
			//console.log(customer.email);
			if(!!customer && customer.id !== id){
				console.log('Error time');
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

export default testingRouter;
