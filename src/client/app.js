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

var attachEvent = function(selector, type, fn){
	var eles = document.querySelectorAll(selector);
	if(!!eles.length){
		for (var i = 0; i < eles.length; i++) {
			eles[i].addEventListener(type, fn);
		}
	}
};

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

function productListDisplayTemplate(product){
	var template = '<li class="list-group-item">'+
	'<p>{{title}} <button class="btn btn-info btn-xs update-data" data-id="{{id}}">'+
	'<span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button>'+
	'<button class="btn btn-danger btn-xs pull-right remove-product" data-id="{{id}}"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button></p>'+
	'<div class="input-group">'+
	'<span class="input-group-addon">Show at</span>'+
	'<input class="form-control" type="text" name="show_at" placeholder="Example: 1:00" data-id="{{id}}" value="{{show_at}}" />'+
	'</div>'+
	'</li>';

	return template.replace('{{title}}', product.title).replace(/{{id}}/gi, product.id).replace('{{show_at}}', product.show_at || '');
};

function notInCollectionTemplate(product){
	var template = '<li class="list-group-item">'+
	'<p>{{title}} <button class="btn btn-info btn-xs update-data" data-id="{{id}}">'+
	'<span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button>'+
	'<button class="btn btn-default btn-xs pull-right add-to" data-id="{{id}}"><i class="glyphicon glyphicon-plus"></i><span class="visible-lg-inline"> Add to Collection</span></button></p>'+
	'</li>';

	return template.replace('{{title}}', product.title).replace(/{{id}}/gi, product.id);
};

function getCollectionProducts(collection_id, index){
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
				return productListDisplayTemplate(product);
			}) : ['<li class="list-group-item">No products found for this collection.</li>'];

			var notInCollection = !!not_in.length ? not_in.map((product) => {
				return notInCollectionTemplate(product);
			}) : ['<li class="list-group-item">No products more products to add.</li>'];

			//notInCollection.unshift('<option value="null">Select a product to add</option>');

			//console.log(productTitles);

			document.getElementById('dataDump_'+index).innerHTML = productTitles.join('');

			document.getElementById('notInList_'+index).innerHTML = notInCollection.join('');

			var hiddenCollectionIdInputs = document.querySelectorAll('.current-collection-id-'+index);
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

var collectionChange = function(e){
	var select = this,
		collection_id = this.value;
		index = this.getAttribute('data-index');
	getCollectionProducts(collection_id, index);
};

var getAllCollectionOptions = function(){
	var selects = document.querySelectorAll('.collection-name');
	if(!!selects.length){
		for (var i = 0; i < selects.length; i++) {
			let select = selects[i];
			getCollectionOptions(select);
		}
	}
	else {
		var setupComplete = document.querySelector('#setupComplete');
		if(!!setupComplete){
			setupComplete.classList.remove('hidden');
		}
	}
	return selects;
};

var getCollectionOptions = function(select){
	var setupComplete = document.querySelector('#setupComplete'),
		options = [];


	if(!!select && !select.children.length){

		$.ajax({
			url: './collections/',
			type: 'GET',
			dataType: 'json'
		}).then( (response) => {
			if(!!response.error){
				console.log(response.error);
				return window.location.replace('/auth');
			}

			if(!!select){
				options = response.map( (opt) => {
					let selected = opt.id === select.getAttribute('data-selected') ? 'selected="selected"' : '';
					return '<option value="'+opt.id+'" data-product-count="'+opt.product_count+'" '+selected+'>'+opt.title+'</option>';
				});

				select.innerHTML = select.innerHTML + options.join('');
			}

			if(!!setupComplete){
				setupComplete.classList.remove('hidden');
			}
		})
		.fail(err => {
			console.error(err);
		});

	}
	else if(!!setupComplete){
		setupComplete.classList.remove('hidden');
		getCollectionProducts(select.value, select.getAttribute('data-index'));
	}

	if(!!select){
		select.removeEventListener('change', collectionChange);
		select.addEventListener('change', collectionChange);
	}

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

// var collectionForm = document.querySelector('#newCollection');
// if(!!collectionForm){
// 	collectionForm.addEventListener('submit', createNewCollection);
// }
attachEvent('.new-collection', 'submit', createNewCollection);

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

//
attachEvent('.new-product', 'submit', createNewProduct);

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
			getCollectionProducts(json['collection_id'], this.getAttribute('data-index'));
		}
	});
}

// var productToCollections = document.querySelector('#addProduct');
// if(!!productToCollections.length){
// 	for (var i = 0; i < productToCollections.length; i++) {
// 		productToCollections[i].addEventListener('submit', changeCollection);
// 	}
// }

attachEvent('.add-to', 'click', pidUpdateAndSubmit);

function pidUpdateAndSubmit(e){
	var target = e.target,
		p_id = target.getAttribute('data-id'),
		index = target.parentElement.parentElement.parentElement.getAttribute('data-index');
	var form = document.querySelector('#allOtherProducts_'+index);
	if(!!form && !!form.submit){
		form.submit();
	}
}

attachEvent('.add-product', 'submit', changeCollection);

function changeCollection(e) {
	e.preventDefault();
	var target = e.target,
		index = target.getAttribute('data-index'),
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
			getCollectionProducts(json['collection_id'], index);
		}
	});
}

// var listWrapper = document.querySelector('#dataDump');
// if(!!listWrapper){
// 	listWrapper.addEventListener('click', updateProduct);
// }
attachEvent('.data-list', 'click', updateProduct);

function updateProduct(e){
	e.preventDefault();
	var target = e.target,
		product_id = target.classList.contains('update-data') ? Number(target.getAttribute('data-id')): 0,
		index = target.getAttribute('data-index');

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
				getCollectionProducts(document.querySelector('#collectionName_'+index).value, index);
			}
		});
	}
}


