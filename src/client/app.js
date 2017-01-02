import $ from 'jquery';
import * as FBAPI from '../public/firebase-api.js';
//import fetchData from './fetch-data.js';

function getCollectionProducts(collection_id){
	let ref = FBAPI.getRef('shopify/products');
	FBAPI
		.listen(ref, 'once', 'value')
		.then(function(snapshot){
			let json = snapshot.exportVal();
			let products = Object.keys(json).filter((key) => {
				let product = json[key];
				if(product.collection_id === collection_id){
					return key;
				}
				return false;
			}).map((key) => {
				let product = json[key];
				let options = dataSplit(product.options);
				let variants = dataSplit(product.variants);
				product.options = options;
				product.variants = variants;
				return product;
			});

			var productTitles = !!products.length ? products.map((product) => {
				return '<li>'+product.title+'</li>';
			}) : ['<li>No products found for this collection.</li>'];

			//console.log(productTitles);

			document.getElementById('dataDump').innerHTML = productTitles.join('');

			document.getElementById('currentCollectionId').value = collection_id;
		});
}

function dataSplit(stringData){
	if(!stringData){
		return;
	}

	if(typeof stringData !== 'string'){
		return stringData;
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

var getAllCollectionOptions = (function(){
	var select = document.querySelector('#collectionName'),
		options = [];

	if(!select){
		return;
	}

	$.ajax({
		url: './collections',
		type: 'GET',
		dataType: 'json'
	}).then( (response) => {

		options = response.map( (opt) => {
			return '<option value="'+opt.id+'" data-product-count="'+opt.product_count+'">'+opt.title+'</option>';
		});

		select.innerHTML = select.innerHTML + options.join('');
	});

	select.addEventListener('change', function(e){
		var select = this,
			collection_id = this.value;
		getCollectionProducts(collection_id);
	});

}());

var collectionForm = document.querySelector('#newCollection');
collectionForm.addEventListener('submit', createNewCollection);

function createNewCollection(e){
	e.preventDefault();
	var formData = new FormData(this),
		json = {};
	
	for(let p of formData){
		json[p[0]] = p[1];
	}

	$.ajax({
		url: './collections/new',
		type: 'POST',
		dataType: 'json',
		data: json
	}).then( (returnedJson) => {
		if(returnedJson.error){
			return console.error(returnedJson.error);
		}

		let collection = returnedJson[1];
		let select = document.querySelector('#collectionName');
		let newOption = '<option value="'+collection.id+'" data-product-count="0">'+collection.title+'</option>';
		select.innerHTML =  select.innerHTML + newOption;
		select.selectedIndex = (select.children.length - 1);
	});

	/*fetchData.set({
		url: 'http://pcoleman-mb.internal.pixafy.com:3030/collections',
		body: json
	}, function(promise){
		var cast = Promise.resolve(promise);
        cast.then(function(data){
            console.log(data);
        });
	});*/
}

var productForm = document.querySelector('#newProduct');
productForm.addEventListener('submit', createNewProduct);

function createNewProduct(e){
	e.preventDefault();
	var formData = new FormData(this),
		json = {};
	
	for(let p of formData){
		json[p[0]] = p[1];
	}

	$.ajax({
		url: './products/new',
		type: 'POST',
		dataType: 'json',
		data: json
	}).then( (returnedJson) => {
		if(returnedJson.error){
			return console.error(returnedJson.error);
		}

		let product = returnedJson[1];
		//console.log(product);
		if(!!product){
			getCollectionProducts(json['collection_id']);
		}
	});
}

