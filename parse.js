var fs = require('fs'),
	path = require('path');

var getDirContents = function(dir, files, dirs) {
	var dirFiles = fs.readdirSync(dir);
	
	for (var i = 0, il = dirFiles.length; i < il; i++) {
		var file = dirFiles[i],
			fPath = path.resolve(dir, file),
			stat = fs.statSync(fPath);
		
		if (stat.isDirectory()) {
			dirs.push(fPath);
		} else if (stat.isFile()) {
			files.push(fPath);
		}
	}
};

var parseFiles = function(dir, opt_classes) {
	var classes = opt_classes || [],
		files = [],
		dirs = [],
		msgData = null;
	
	getDirContents(dir, files, dirs);
	
	for (var i = 0, il = files.length; i < il; i++) {
		var file = files[i],
			data = fs.readFileSync(file, 'utf8');
		
		if (file.indexOf('msg.js') !== -1) {
			msgData = data;
		} else {
			try {
				parseFile(data, classes);
			} catch (err) {
				process.stdout.write('Error processing ' + file + '\n');
				process.stdout.write(err + '\n');
			}
		}
	}
	
	for (var i = 0, il = dirs.length; i < il; i++) {
		var dirPath = dir + '/' + path.basename(dirs[i]);
		parseFiles(dirPath, classes);
	}
	
	if (msgData) {
		parseMessages(msgData, classes);
	}
	
	return classes;
};

var parseFile = function(data, classes) {
	var classStrs = data.split('@class');
	
	for (var i = 1, il = classStrs.length; i < il; i++) {
		var cls = classStrs[i],
			ndx = cls.indexOf('*/'),
			head = cls.substr(0, ndx),
			body = cls.substr(ndx + 2).trim(),
			clsObj = {
				funcs: [],
				props: [],
				msgs: []
			};
		
		// Check for a parent class
		ndx = head.indexOf('@extends');
		
		if (ndx > -1) {
			var stop = head.indexOf('*', ndx);
			
			if (stop > ndx) {
				clsObj.parent = head.substring(ndx + 8, stop).trim();
			} else {
				clsObj.parent = head.substr(ndx + 8).trim();
			}
		}
		
		// Parse the class description
		ndx = head.indexOf('@');
		
		if (ndx > -1) {
			head = head.substr(0, ndx);
		}
		
		clsObj.desc = head.split(/\s*\*\s*/gm).join(' ').trim();
		
		// Parse the class name
		ndx = body.search(/\s*=\s*function/m);
		var clsName = body.substr(0, ndx);
		clsObj.name = clsName;
		
		// Find the prototype declaration
		var re = new RegExp(clsName + '.prototype\\s*=\\s*{');
		ndx = body.search(re);
		
		if (ndx > -1) {
			// Parse the class functions
			head = body.substr(0, ndx);
			ndx = body.indexOf('/**', ndx);
			body = body.substr(ndx + 3);
			var funcs = body.split(/\,\s*\/\*\*/gm);
			
			for (var j = 0, jl = funcs.length; j < jl; j++) {
				var func = parseFunction(funcs[j]);
				
				if (func.params) {
					clsObj.funcs.push(func);
				} else {
					clsObj.props.push(func);
				}
			}
		} else {
			head = body;
		}
		
		ndx = head.indexOf('{');
		var count = 1;
		
		while (count > 0) {
			var ch = head[++ndx];
			
			if (ch === '{') {
				++count;
			} else if (ch === '}') {
				--count;
			}
		}
		
		head = head.substr(0, ndx);
		var props = head.split('/**');
		
		for (var j = 1, jl = props.length; j < jl; j++) {
			var propStr = props[j],
				prop = {};
			
			ndx = propStr.indexOf('*/');
			var propDecl = propStr.substr(ndx + 2);
			propStr = propStr.substr(0, ndx);
			
			ndx = propDecl.indexOf('this.');
			propDecl = propDecl.substr(ndx + 5);
			ndx = propDecl.search(/\s*=/);
			prop.name = propDecl.substr(0, ndx);
			
			propStr = propStr.split(/\s*\*\s*/gm).join(' ');
			ndx = propStr.indexOf('@');
			prop.desc = propStr.substr(0, ndx).trim();
			ndx = propStr.indexOf('@type');
			propStr = propStr.substr(ndx + 5);
			ndx = propStr.indexOf('@');
			
			if (ndx === -1) {
				prop.type = propStr.trim();
			} else {
				prop.type = propStr.substr(0, ndx).trim();
			}
			
			clsObj.props.push(prop);
		}
		
		classes.push(clsObj);
	}
	
	return classes;
};

var parseFunction = function(funcStr) {
	var end = funcStr.indexOf('*/'),
		desc = funcStr.substr(0, end),
		ndx = desc.indexOf('@'),
		params = [],
		func = {};
	
	funcStr = funcStr.substr(end + 2);
	
	if (funcStr.search(/:\s*function\s*\(/) > -1) {
		if (ndx > -1) {
			var paramStrs = desc.substr(ndx + 1);
			desc = desc.substr(0, ndx);
			
			paramStrs = paramStrs.split(/\s*\*\s*@/gm);
			
			for (var i = 0, il = paramStrs.length; i < il; i++) {
				var obj = parseParam(paramStrs[i]);
				
				if (obj == null) {
					// skip this param for now
				} else if (obj.name != null) {
					params.push(obj);
				} else {
					func.ret = obj;
				}
			}
		}
		
		func.params = params;
	} else {
		if (ndx > -1) {
			var tags = desc.substr(ndx);
			desc = desc.substr(0, ndx);
			ndx = tags.indexOf('@type');
			tags = tags.substr(ndx + 5);
			func.type = tags.match(/\S+/)[0];
		}
	}
	
	func.desc = desc.split(/\s*\*\s*/gm).join(' ').trim();
	ndx = funcStr.indexOf(':');
	func.name = funcStr.substring(0, ndx).trim();
	
	return func;
};

var parseParam = function(param) {
	var ndx = param.search(/(\{|\s)/m),
		pType = param.substr(0, ndx).trim(),
		start = param.indexOf('{'),
		stop = param.indexOf('}', start),
		vType = param.substring(start + 1, stop),
		words = param.substr(stop + 1).trim().split(/\s+\**\s*/m),
		obj = {
			type: vType
		};
	
	switch(pType) {
		case 'param':
			obj.name = words.shift();
			obj.desc = words.join(' ');
			break;
		case 'return':
			obj.desc = words.join(' ');
			break;
		case 'example':
		case 'see':
		case 'throws':
		case 'type':
			obj = null;
			break;
		default:
			throw Error('Unrecognized parameter type tag.');
			break;
	}
	
	return obj;
};

var parseMessages = function(data, classes) {
	debugger;
	var ndx = data.search(/hemi.msg\s*=/),
		msgObj = {};
	
	data = data.substr(ndx);
	var msgs = data.split(/\,\s*\/\*\*/gm);
	
	for (var i = 0; i < msgs.length; ++i) {
		var msg = msgs[i],
			nameStart = msg.indexOf('*/') + 2,
			nameEnd = msg.indexOf(':', nameStart),
			name = msg.substring(nameStart, nameEnd).trim(),
			exs = msg.split(/@example\s*\*\s*/gm);
		
		for (var j = 1; j < exs.length; ++j) {
			var ex = exs[j],
				start = ex.indexOf('-'),
				stop = ex.search(/data\s*=\s*{/gm),
				clsName = ex.substring(0, start).trim(),
				clsArr = msgObj[clsName],
				desc = ex.substring(start + 1, stop);
			
			if (!clsArr) {
				clsArr = [];
				msgObj[clsName] = clsArr;
			}
			
			desc = desc.split(/\s*\*\s*/gm).join(' ').trim();
			clsArr.push({
				name: name,
				desc: desc
			});
		}
	}
	
	for (var i = 0; i < classes.length; ++i) {
		var cls = classes[i],
			clsArr = msgObj[cls.name];
		
		if (clsArr) {
			cls.msgs = clsArr;
		}
	}
};

var stringify = function(data) {
	var type = typeof data,
		str;
	
	if (data instanceof Array) {
		str = '[';
		
		for (var i = 0, il = data.length; i < il; i++) {
			if (i > 0) {
				str += ',';
			}
			str += stringify(data[i]);
		}
		
		str += ']';
	} else if (type === 'object') {
		var first = true;
		str = '{';
		
		for (var x in data) {
			var val = data[x];
			
			if (first) {
				first = false;
			} else {
				str += ',';
			}
			
			str += '"' + x + '":';
			str += stringify(val);
		}
		
		str += '}';
	} else if (type === 'string') {
		str = '"' + data.replace(/"/g, '\\"') + '"';
	} else if (type === 'boolean') {
		str = data ? 'true' : 'false';
	} else {
		str = '' + data;
	}
	
	return str;
};

var classes = parseFiles('public/js/hemi');
var str = stringify(classes);
fs.writeFileSync('public/js/editor/data/hemi.json', str);
