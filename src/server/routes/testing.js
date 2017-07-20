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
			})
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
	.post(urlencode, (request, response) => {
		let id = parseInt(request.body.id, 10);
		let new_email = request.body.new_email;
		console.log(new_email);
		SHAPI.updateCustomer(SHAPI.getInstance(request), id, { "id":id,"email":new_email, "note": "Customer updated via API." }, (data) => {
			return response.status(200).json(data);
		});
	});

export default testingRouter;
