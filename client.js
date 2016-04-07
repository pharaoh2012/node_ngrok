/* global Buffer */
/* global process */

var http = require("http");

var gid = process.env["NODE_PROXY_NAME"] || "office";
var host = process.env["NODE_SERVER_HOST"];
var port = parseInt(process.env["NODE_SERVER_PORT"], 10);

var timeId = 0;


var connectToServer = function() {
	console.info(new Date().toLocaleString(), "connectToServer...");

	var options = {
		host: host,
		port: port,
		path: "/__ph_cmd/" + gid + "/get/0?" + Date.now(),
		method: 'GET',
		headers: {
			"Content-Type": "application/json"
		}
	};

	//console.info(options);

	var req = http.request(options, function(res) {
		//res.setEncoding('utf8');
		console.log("statusCode: ", res.statusCode);
		var body = "";
		res.on('data', function(chunk) {
			//body.push(chunk);
			body += chunk;
		});
		res.on('end', function() {

			//body = Buffer.concat(body);
			console.info("server return");
			if (res.statusCode == 206) {
				console.info("time out.");
				connectToServer();
				return;
			}
			//console.info(body);

			connectToServer();
			getLocalhostUrl(JSON.parse(body), function(ret) {
				//console.info(JSON.stringify(ret));
				sendResultToServer(ret);
			});
		});
	});


	req.on('error', function(e) {
		console.error("LOG:", e);
		connectToServer();
	});
	//req.write();
	req.end();

};

connectToServer();

function sendResultToServer(ret) {
	console.info("sendResultToServer...");

	var options = {
		host: host,
		port: port,
		path: "/__ph_cmd/" + gid + "/result/" + ret.cmdId + "/?" + Date.now(),
		method: 'POST'
	};

	//console.info(options);

	var req = http.request(options, function(res) {
		//res.setEncoding('utf8');
		console.log("statusCode: ", res.statusCode);

		res.on('data', function(chunk) {

		});
		res.on('end', function() {


			console.info("server return");

		});
	});


	req.on('error', function(e) {
		console.error("LOG:", e);

	});
	req.write(JSON.stringify(ret));
	req.end();
}


function getLocalhostUrl(json, callback) {
	//console.info("json", json);
	//var port = json.port;
	console.info(json.headers.method, json.headers.port, json.headers.url);
	var options = {
		host: '127.0.0.1',
		port: json.headers.port,
		path: json.headers.url,
		method: json.headers.method,
		headers: json.headers
	};
	//console.info("options", options);
	var req = http.request(options, function(res) {
		//console.info(res.headers);
		var contentType = res.headers["content-type"];
		var isText = false;
		if (res.headers["content-encoding"]) {
			isText = false;
		} else if (contentType) {
			isText = res.headers["content-type"].indexOf("text/") >= 0;
		}

		res.headers["ph_name"] = gid;
		res.headers["ph_port"] = options.port;

		var ret = {
			cmd: "result",
			cmdId: json.cmdId,
			code: res.statusCode,
			headers: res.headers
		};

		var body = [];

		res.on('data', function(d) {
			body.push(d);
		});
		res.on('end', function(d) {
			body = Buffer.concat(body);
			ret.isText = isText;
			console.info("isText", isText);
			if (isText) {
				ret.body = body.toString();
			} else {
				ret.body = body.toString("base64");
			}

			callback(ret);
		});
	});
	if (json.body) {
		req.write(json.body);
	}
	req.end();

	req.on('error', function(e) {
		console.error("LOG:", e);
		callback({
			cmd: "result",
			cmdId: json.cmdId,
			code: 500,
			headers: {
				"Content-Type": "text/html; charset=utf-8"
			},
			isText: true,
			body: e.toString()
		});
	});

}