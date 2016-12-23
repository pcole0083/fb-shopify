import * as FBAPI from '../public/firebase-api.js';
import * as SHAPI from './shopify-api.js';

const collectionId = '401120973';

var fbCollection = FBAPI.getRef('shopify/collections/'+collectionId);

SHAPI.
	getCollectionById(collectionId, 10, null, (collection) => {
		FBAPI.addData('shopify/collections', collection);
	});

// SHAPI.
// 	getProductsCollection(collectionId, 10, null, (list) => {
// 		//console.log(list);
// 		list.forEach((item) => {
// 			FBAPI.addData('shopify/products', item);
// 		});
// 	});	


