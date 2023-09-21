/**
 * Copyright 2021 Thetis Apps Aps
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * 
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const axios = require('axios');

/**
 * Send a response to CloudFormation regarding progress in creating resource.
 */
async function sendResponse(input, context, responseStatus, reason) {

	let responseUrl = input.ResponseURL;

	let output = new Object();
	output.Status = responseStatus;
	output.PhysicalResourceId = "StaticFiles";
	output.StackId = input.StackId;
	output.RequestId = input.RequestId;
	output.LogicalResourceId = input.LogicalResourceId;
	output.Reason = reason;
	await axios.put(responseUrl, output);
}

exports.initializer = async (input, context) => {
	
	try {
	    let contextId = process.env.ContextId;
		let ims = await getIMS();
		let requestType = input.RequestType;
		if (requestType == "Create") {
		    let setup = new Object();
		    setup.appId = '7292be887d884b24924b7238bf892601';
            await ims.patch('contexts/' + contextId + '/dataDocument', { OpenExchangeRates: setup });
		}
		await sendResponse(input, context, "SUCCESS", "OK");

	} catch (error) {
		await sendResponse(input, context, "SUCCESS", JSON.stringify(error));
	}

};

async function getOpenExchangeRates(setup) {

    let oer = axios.create({
    		baseURL: 'https://openexchangerates.org/api/',
    		headers: { "Content-Type": "application/json" }
    	});
	
	oer.interceptors.response.use(function (response) {
			console.log("SUCCESS " + JSON.stringify(response.data));
 	    	return response;
		}, function (error) {
			if (error.response) {
				console.log("FAILURE " + error.response.status + " - " + JSON.stringify(error.response.data));
			}
	    	return Promise.reject(error);
		});
  
    return oer;
}

async function getExchangeRate(oer, appId, base, target) {
	let response = await oer.get('latest.json', { params: { app_id: appId, base: target, symbols: [ base ] }});
	let data = response.data;
	return data.rates[base];
}

async function getIMS() {
	
    const authUrl = "https://auth.thetis-ims.com/oauth2/";
    const apiUrl = "https://api.thetis-ims.com/2/";

	var clientId = process.env.ClientId;   
	var clientSecret = process.env.ClientSecret; 
	var apiKey = process.env.ApiKey;  
	
    let data = clientId + ":" + clientSecret;
	let base64data = Buffer.from(data, 'UTF-8').toString('base64');	
	
	var imsAuth = axios.create({
			baseURL: authUrl,
			headers: { Authorization: "Basic " + base64data, 'Content-Type': "application/x-www-form-urlencoded" },
			responseType: 'json'
		});
    
    var response = await imsAuth.post("token", 'grant_type=client_credentials');
    var token = response.data.token_type + " " + response.data.access_token;
    
    var ims = axios.create({
    		baseURL: apiUrl,
    		headers: { "Authorization": token, "x-api-key": apiKey, "Content-Type": "application/json" }
    	});
	

	ims.interceptors.response.use(function (response) {
			console.log("SUCCESS " + JSON.stringify(response.data));
 	    	return response;
		}, function (error) {
			console.log(JSON.stringify(error));
			if (error.response) {
				console.log("FAILURE " + error.response.status + " - " + JSON.stringify(error.response.data));
			}
	    	return Promise.reject(error);
		});

	return ims;
}

exports.updateRates = async (event, x) => {
	
    console.info(JSON.stringify(event));
    
    let contextId = process.env.ContextId;
    
    let ims = await getIMS();
    
    let oer = await getOpenExchangeRates();
    
    let response = await ims.get('contexts/' + contextId);
    let context = response.data;
    let appId = JSON.parse(context.dataDocument).OpenExchangeRates.appId;

	response = await ims.get('currencies');
	let currencies = response.data;
    
    for (let currency of currencies) {
		let exchangeRate = await getExchangeRate(oer, appId, context.baseCurrencyCode, currency.currencyCode);
		response = await ims.patch('currencies/' + currency.id, { exchangeRate: exchangeRate });
    }

	return "DONE";
};