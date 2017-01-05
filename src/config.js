const config = {
    development: {
        db: 'mongodb://localhost/sample_api', // -> host/database_name[/port][/options]
        oauth: {
			sharedSecret: '7969310b79a5e99b21349e2097a5ff40',
			redirectUri: 'http://localhost:3030/authorize',
			apiKey: 'db7c687e9e9afbed4cffb118951c7f29'
		}
    },

    production: {
        db: 'mongodb://localhost/sample_api',
        oauth: {
			sharedSecret: '7969310b79a5e99b21349e2097a5ff40',
			redirectUri: 'http://localhost:3030/authorize',
			apiKey: 'db7c687e9e9afbed4cffb118951c7f29'
		}
    }
};

export default config;
