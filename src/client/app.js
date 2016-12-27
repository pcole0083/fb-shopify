import * as FBAPI from '../public/firebase-api.js';

let ref = FBAPI.getRef('shopify/products');
FBAPI
	.listen(ref, 'once', 'value')
	.then(function(snapshot){
		let json = snapshot.exportVal();
		let products = Object.keys(json).map((key) => {
			let product = json[key];
			let options = dataSplit(product.options);
			let variants = dataSplit(product.variants);
			product.options = options;
			product.variants = variants;
			return product;
		});
		document.getElementById('dataDump').innerHTML = JSON.stringify(products);
	});


function dataSplit(stringData){
	if(!stringData){
		return;
	}

	return stringData.split('\n\n').map((opt) => {
		let optArray = opt.split('\n').map((sub) => {
			let split = sub.split(': ');
			let sub_obj = {};
			sub_obj[split[0]] = split[1].indexOf('[') > -1 ? JSON.parse(split[1].replace(/u/g, '').replace(/\'/g, '"')) : split[1];
			return sub_obj;
		});
		return Object.assign.apply(Object, optArray);
	});
}