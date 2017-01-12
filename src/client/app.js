import $ from 'jquery';
import * as FBAPI from '../public/firebase-api.js';
//import fetchData from './fetch-data.js';

var initialCookies = (function(){
	var cookiesObj = {};
	document.cookie.split(';').forEach(function(pair){
		var keyVal = pair.trim().split('=');
		cookiesObj[keyVal[0]] = keyVal[1];
	});
	return cookiesObj;
}());

var checkFirebaseCreds = (function(){
	var setupFirebase = document.querySelector('#setupFirebase');
	if(!!setupFirebase || !!setupComplete){
		$.ajax({
			url: './configs/firebase',
			type: 'GET',
			dataType: 'json',
		}).then(configObj => {
			if(!!configObj.error && !!setupFirebase){
				setupFirebase.classList.remove('hidden');
			}
			else {
				getAllCollectionOptions();
			}
		});
	}
}());

// var getStoreInfo = (function(){
// 	$.ajax({
// 		url: './auth',
// 		type: 'GET',
// 		dataType: 'json',
// 	}).then(jsonData => {
// 		if(!!jsonData.error){
// 			document.querySelector('#setupFirebase').classList.remove('hidden');
// 		}
// 		else {
// 			console.log(jsonData);
// 		}
// 	});
// }());

function getCollectionProducts(collection_id){
	if(!initialCookies || !initialCookies.shopname){
		return console.log('Store name needs to be set first.');
	}

	let ref = FBAPI.getRef('shopify/'+initialCookies.shopname+'/products');
	FBAPI
		.listen(ref, 'once', 'value')
		.then(function(snapshot){
			let json = snapshot.exportVal();
			let not_in = [];
			let products = Object.keys(json).filter((key) => {
				let product = json[key];
				if(product.collection_id === collection_id){
					return key;
				}
				else {
					not_in.push(product);
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
				return '<li>'+product.title+' <button class="btn btn-info btn-sm update-data" data-id="'+product.id+'"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button></li>';
			}) : ['<li>No products found for this collection.</li>'];

			var notInCollection = !!not_in.length ? not_in.map((product) => {
				return '<option value="'+product.id+'">'+product.title+'</option>';
			}) : [];

			notInCollection.unshift('<option value="null">Select a product to add</option>');

			//console.log(productTitles);

			document.getElementById('dataDump').innerHTML = productTitles.join('');

			document.getElementById('allOtherProducts').innerHTML = notInCollection.join('');

			var hiddenCollectionIdInputs = document.querySelectorAll('.current-collection-id');
			if(hiddenCollectionIdInputs.length){
				for (var j = 0; j < hiddenCollectionIdInputs.length; j++) {
					hiddenCollectionIdInputs[j].value = collection_id;
				}
			}
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

var getAllCollectionOptions = function(){
	var select = document.querySelector('#collectionName'),
		setupComplete = document.querySelector('#setupComplete'),
		options = [];

	if(!select){
		return;
	}

	$.ajax({
		url: './collections/',
		type: 'GET',
		dataType: 'json'
	}).then( (response) => {
		if(!!response.error){
			console.log(response.error);
			return window.location.replace('/auth');
		}

		options = response.map( (opt) => {
			return '<option value="'+opt.id+'" data-product-count="'+opt.product_count+'">'+opt.title+'</option>';
		});

		select.innerHTML = select.innerHTML + options.join('');

		if(!!setupComplete){
			setupComplete.classList.remove('hidden');
		}
	})
	.fail(err => {
		console.error(err);
	});

	select.addEventListener('change', function(e){
		var select = this,
			collection_id = this.value;
		getCollectionProducts(collection_id);
	});

};

var fbForm = document.querySelector('#firebaseConfig');
if(!!fbForm){
	fbForm.addEventListener('submit', submitConfig);
}

function submitConfig(e){
	e.preventDefault();
	var formData = new FormData(this),
		json = {};
	
	for(let p of formData){
		json[p[0]] = p[1];
	}

	$.ajax({
		url: './configs/firebase',
		type: 'POST',
		dataType: 'json',
		data: json
	}).then( (returnedJson) => {
		if(!!returnedJson.error){
			return console.error(returnedJson.error);
		}
		else {
			return setTimeout(function(){
				window.location.reload();
			}, 12000);
		}
	});
}

var collectionForm = document.querySelector('#newCollection');
if(!!collectionForm){
	collectionForm.addEventListener('submit', createNewCollection);
}

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
		if(!!returnedJson.error){
			console.error(returnedJson.error);
			return window.location.href = '/auth';
		}

		let collection = returnedJson[1];
		let select = document.querySelector('#collectionName');
		let newOption = '<option value="'+collection.id+'" data-product-count="0">'+collection.title+'</option>';
		select.innerHTML =  select.innerHTML + newOption;
		select.selectedIndex = (select.children.length - 1);
	});
}

var productForm = document.querySelector('#newProduct');
if(!!productForm){
	productForm.addEventListener('submit', createNewProduct);
}

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

var productToCollection = document.querySelector('#addProduct');
if(!!productToCollection){
	productToCollection.addEventListener('submit', changeCollection);
}

function changeCollection(e) {
	e.preventDefault();
	var formData = new FormData(this),
		json = {};

	for(let p of formData){
		json[p[0]] = p[1];
	}

	$.ajax({
		url: './collections/add',
		type: 'POST',
		dataType: 'json',
		data: json
	}).then( (returnedJson) => {
		if(returnedJson.error){
			return console.error(returnedJson.error);
		}

		let collect = returnedJson[1];
		console.log(collect);
		if(!!collect){
			getCollectionProducts(json['collection_id']);
		}
	});
}

var listWrapper = document.querySelector('#dataDump');
if(!!listWrapper){
	listWrapper.addEventListener('click', updateProduct);
}

function updateProduct(e){
	e.preventDefault();
	var target = e.target,
		product_id = target.classList.contains('update-data') ? Number(target.getAttribute('data-id')): 0;

	if(!!product_id){
		$.ajax({
			url: './products/update',
			type: 'POST',
			dataType: 'json',
			data: {product_id: product_id}
		}).then( (returnedJson) => {
			if(returnedJson.error){
				return console.error(returnedJson.error);
			}

			let product = returnedJson[1];
			if(!!product){
				getCollectionProducts(document.querySelector('#collectionName').value);
			}
		});
	}
}


