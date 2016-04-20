var http = require('http');
var basicAuth = require('./basic-auth.js');

var g_cmds = {};
var cmdId = 0;
var cmdParams = {};

function SendResponse(res, status, txt) {
	res.writeHead(status, {});
	res.end(txt);
}

function sendDataToClient(response, result) {
	console.info("send data to user.");
	if (typeof(result) === "string") {
		result = JSON.parse(result);
	}
	response.writeHead(result.code, result.headers);
	if (result.isText) {
		response.end(result.body);
	} else {
		response.end(new Buffer(result.body, "base64"));
	}
}

function checkClientCmd(name, res) {
	res.phTimeCount--;
	if (res.phTimeCount <= 0) {
		res.writeHead(206, {});
		res.end();
		return;
	}

	if (g_cmds[name] && g_cmds[name].length) {
		var cmd = g_cmds[name].shift();
		if ((Date.now() - cmd.time) > 100000) { //100s,放弃命令
			console.info("skip old cmd");
			checkClientCmd(name, res);
			return;
		}
		console.info("send data to client");
		res.end(JSON.stringify(cmd));
		return;
	} else {
		setTimeout(function() {
			checkClientCmd(name, res);
		}, 100);
	}
}



var server = http.createServer(function(request, response) {
	var body = "";

	console.log(request.method, request.headers.host, request.url);
	//console.log(request.headers);
	request.on('data', function(chunk) {
		console.info("on data");
		body += chunk;
	});
	request.on('end', function() {
		if (request.url == "/favicon.ico") {
			response.writeHead(404, {});
			response.end();
		}
		//body = Buffer.concat(body);
		//   /__ph_cmd/name/cmd
		if (request.url.indexOf("/__ph_cmd/") === 0) {
			var cmds = request.url.split("/");
			if (cmds.length < 4) {
				response.writeHead(500, {});
				response.end("error cmd.  /__ph_cmd/name/cmd");
				return;
			}
			if(cmds[3] === "noop") {
				response.end("ok");
				return;
			}
			if (cmds[3] === "result") {
				var cmdId = cmds[4];
				var cmd = cmdParams[cmdId];
				sendDataToClient(cmd.res, body);
				return;
			}
			if (cmds[3] === "get") {
				response.phTimeCount = 600;
				checkClientCmd(cmds[2], response);
				return;
			}
			return;
		}


		var user = basicAuth(request);
		console.log('auth', user);
		if (!user || !user.name || !user.pass) {
			response.writeHead(401, {
				'WWW-Authenticate': 'Basic realm=Authorization Required'
			});
			response.end('WWW-Authenticate');
			return;
		}



		var name = user.name;
		var port = parseInt(user.pass);
		if (isNaN(port)) {
			response.writeHead(500, {});
			response.end("host error: port must int " + user.pass);
			return;
		}

		request.headers["url"] = request.url;
		request.headers["method"] = request.method;
		request.headers["body"] = body.toString();
		request.headers["port"] = port;

		sendToClient(name, request.headers, response);


	});
});

var sendToClient = function(name, headers, res) {
	//console.info(name,wsClients);
	delete headers["host"];
	delete headers["connection"];
	delete headers["authorization"];
	//request.headers["ReceptionTime"] = Date.now();
	if (!g_cmds[name]) {
		g_cmds[name] = [];
	}
	cmdId++;
	if (cmdId > 10000) {
		cmdId = 1;
	}

	g_cmds[name].push({
		headers: headers,
		cmdId: cmdId,
		time: Date.now(),
		cmd: "get"
	});

	cmdParams[cmdId] = {
		cmdId: cmdId,
		time: Date.now(),
		res: res
	};

};

server.listen(process.env.VCAP_APP_PORT || 8888);