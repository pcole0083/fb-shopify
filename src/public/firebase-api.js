import firebase from 'firebase';
import * as configJSON from 'firebase.json';
// Initialize Firebase
const config = !!configJSON.apiKey ? configJSON : {
	apiKey: "AIzaSyD6yyYdIQU6CAInFyjynkAvLNzOkYuOyfM",
	authDomain: "vidcom-3a1ba.firebaseapp.com",
	databaseURL: "https://vidcom-3a1ba.firebaseio.com",
	storageBucket: "vidcom-3a1ba.appspot.com",
	messagingSenderId: "246500590648"
};

const fi = firebase.initializeApp(config);

export default fi;

export const getRef = (path) => {
	if(!path){
		return;
	}
	return firebase.database().ref(path);
}

export const query = (ref, chain) => {
	Object.keys(chain).map((methodName, index) => {
		let param = chain[methodName];
		ref[methodName](param);
	});
}

export const listen = (ref, listenType, eventName, callback) => {
	if(!callback){
		return ref[listenType](eventName);
	}
	return ref[listenType](eventName, callback);
}

export const addData = (path, data, callback) => {
	let ref = getRef(path);
	let exists = false;

	ref.orderByChild('id').equalTo(data.id).once('value')
		.then((snapshot) => {
			let dataPoints = snapshot.exportVal(),
				returnData = dataPoints;

			if(!!dataPoints){
				Object.keys(dataPoints).filter(key => {
					let dataPt = dataPoints[key];
					if(~~dataPt.id === ~~data.id){
						return key;
					}
					else{
						return false;
					}
				}).forEach((key) => {
					let dataNew = Object.assign(dataPoints[key], data);
					let newRef = getRef(path+'/'+key);
					newRef.set(dataNew);
					returnData = data;
				});
			}
			if(!exists){
				ref.push(data);
			}

			if(!!callback){
				callback(returnData);
			}
		});

	return ref;
}
