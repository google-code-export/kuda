#!/usr/bin/env node

/*
 * Simple web server to serve the Kuda World Editor. It provides asset
 * management, project management, editor plugin management, and publishing.
 *
 * Add new routes to the var routes as a constant and use the convenience
 * functions for get, post, put, and del for the http verbs.
 *
 * NOTES: Asset importing is currently disabled. Windows does not have tar or
 * zip support out of the box. Currently investigating solutions.
 *
 * Requirements:
 *      node.exe (Windows native)
 *      node (OS X, Linux)
 */
var qs = require('querystring'),
    http = require('http'),
    fs = require('fs'),
    path = require('path'),
    JSONt = 'application/json',
    HTMLt = 'text/html',
    XMLt = 'text/xml',
    PLAINt = 'text/plain',
    opt_quiet = false,
    opt_repl = false, 
    opt_ws = false;
    routes = {
        ROOT: '/',
        ROOTANY: '/*',
        PROJECTS: '/projects',
        PROJECT: '/project',
        MODELS: '/models',
        PLUGINS: '/plugins',
        PUBLISH: '/publish',
        WSEXAMPLE: 'websocket-example',
        rootPath: 'public',
        pluginsPath: 'public/js/editor/plugins',
        projectsPath: 'public/projects',
        assetsPath: 'public/assets',
        //uploadPath: 'public/tmp',
        ws: function(protocol, handler) {
            log('...adding WebSocket handler for protocol ' + protocol);
            this.wss[protocol] = handler;
        },
        wss: {},
        wsConnections: [],
        get: function(route, handler) {
            log('...adding GET handler for route ' + route);
            this.gets[route] = handler;
        },
        gets: {},
        post: function(route, handler) {
            log('...adding POST handler for route ' + route);
            this.posts[route] = handler;
        },
        posts: {},
        put: function(route, handler) {
            log('...adding PUT handler for route ' + route);
            this.puts[route] = handler;
        },
        puts: {},
        del: function(route, handler) {
            log('...adding DELETE handler for route ' + route);
            this.dels[route] = handler;
        },
        dels: {},
        dispatch: function(req, res) {
            var url = req.reqPath;

            switch (req.method) {
            case "GET":
                if (this.gets[url]) {
                    this.gets[url](req, res);
                } else {
                    this.gets['/*'](req, res);
                }
                break;
            case "POST":
                if (this.posts[url]) {
                    this.posts[url](req, res);
                } else {
                    log('unknown POST route ' + url);
                }break;
            case "PUT":
                if (this.puts[url]) {
                    this.puts[url](req, res);
                } else {
                    log('unknown PUT route ' + url);
                }
                break;
            case "DELETE":
                if (this.dels[url]) {
                    this.dels[url](req, res);
                } else {
                    log('unknown DELETE route ' + url);
                }
                break;
            default:
                log('unknown request method ' + req.method);
            }
        }
    },
    log = function(msg) {
        if (!opt_quiet) {
            console.log(msg);
        }
    };

if (process.argv.length > 2) {
    var ndx = 2;

    // Check for flags
    while (process.argv[ndx] && process.argv[ndx].charAt(0) === '-') {
        var flag = process.argv[ndx++];

        switch (flag) {
        case '-q':
            opt_quiet = true;
            break;
        case '-i':
            opt_repl = true;
            break;
        case '-ws':
            opt_ws = true;
            break;
        default:
            console.log('Usage: ' + process.argv[0] + ' ' + path.basename(process.argv[1]) + ' [OPTIONS]');
            console.log(' -q quiet, no logging to the console');
            console.log(' -i interactive, start with a node repl console');
            console.log(' -ws WebSocket, enables WebSockets');
            console.log(' -h help, show the usage');
            process.exit(0);
        }
    }
}

routes.get(routes.ROOT, function(req, res) {
    log('...handling route GET ' + routes.ROOT);
    var data = fs.readFileSync(routes.rootPath + '/index.html');
    res.send(data, 200, HTMLt);
});

routes.get(routes.ROOTANY, function(req, res) {
    log('...handling route GET ' + routes.ROOTANY + ' for ' + req.reqPath);

    var status = 404,
        data = 'The requested URL ' + req.reqPath + ' was not found on this server';

    if (path.existsSync(routes.rootPath + req.reqPath)) {
        status = 200;
        data = fs.readFileSync(routes.rootPath + req.reqPath);
    }

    res.send(data, status, req.contentType);
});

routes.get(routes.PROJECTS, function(req, res) {
    log('...handling route GET ' + routes.PROJECTS);

    if (req.xhr) {
        var data = {
            projects: []
        };

        if (!path.existsSync(routes.projectsPath)) {
            fs.mkdirSync(routes.projectsPath, 0755);
        } else {
            var files = fs.readdirSync(routes.projectsPath);

            for (var i = 0, il = files.length; i < il; i++) {               
                var file = files[i];
                
                if (file.match('.json')) {
                    file = file.split('.')[0];
                    
                    var published = routes.projectsPath + '/' + file + '.html',
                        pData = {
                            name: file,
                            published: path.existsSync(published)
                        };
                    
                    data.projects.push(pData);  
                }
            }
        }

        res.send(JSON.stringify(data), 200, JSONt);
    } else {
        res.send('{}\n', 200, JSONt);
    }
});

routes.get(routes.PROJECT, function(req, res) {
    log('...handling route GET ' + routes.PROJECT);

    if (req.xhr) {
        var name = req.param['name'] + '.json',
            filePath = routes.projectsPath + '/' + name;

        if (path.existsSync(filePath)) {
            var data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            res.send(JSON.stringify(data), 200, JSONt);
        } else {
            res.send('', 404, PLAINt);
        }
    } else {
        res.send('{}\n', 200, JSONt);
    }
});

routes.post(routes.PROJECT, function(req, res) {
    log('...handling route POST ' + routes.PROJECT);

    if (req.xhr) {
        if (!path.existsSync(routes.projectsPath)) {
            fs.mkdirSync(routes.projectsPath, 0755);
        }

        var defName = 'project',
            param = req.param,
            name = (param['name'] || defName) + '.json',
            replace = param['replace'] == 'true',
            filePath = routes.projectsPath + '/' + name;

        if (path.existsSync(filePath) && !replace) {
            var oldData = {
                name: param['name'],
                octane: param['octane']
            };

            res.send(JSON.stringify({
                errType: 'fileExists',
                errData: oldData,
                errMsg: 'File by that name already exists'
            }), 400, JSONt);
        } else {
            var input = param['octane'];

            fs.writeFileSync(filePath, input);
            res.send(JSON.stringify({
                name: name
            }), 200, JSONt);
        }
    } else {
        res.send('{}\n', 200, JSONt);
    }
});

routes.del(routes.PROJECT, function(req, res) {
    log('...handling route DELETE ' + routes.PROJECT);

    if (req.xhr) {
        var name = req.param['name'],
            filePath = routes.projectsPath + '/' + name + '.json';

        if (path.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.send(JSON.stringify({
                name: name,
                msg: 'Successfully removed ' + name
            }), 200, JSONt);
        } else {
            res.send('', 404, JSONt);
        }
    } else {
        res.send('{}\n', 200, JSONt);
    }
});

routes.get(routes.MODELS, function(req, res) {
    log('...handling route GET ' + routes.MODELS);

    var data = {
        models: []
    };
    
    if (!path.existsSync(routes.assetsPath)) {
        fs.mkdirSync(routes.assetsPath, 0755);
    } else {
        var files = fs.readdirSync(routes.assetsPath),
            urlDir = 'assets/';
        
        for (var i = 0, il = files.length; i < il; i++) {               
            var file = files[i],
                dir = routes.assetsPath + '/' + file,
                mDir = urlDir + file,
                stat = fs.statSync(dir);
            
            if (stat.isDirectory()) {
                var mFiles = fs.readdirSync(dir),
                    mData = {
                        name: file
                    },
                    found = false;
                
                for (var j = 0, jl = mFiles.length; j < jl && !found; j++) {
                    var mFile = mFiles[j];
                    
                    if (mFile.match('.dae')) {
                        mData.url = mDir + '/' + mFile;
                        found = true;
                    }
                }
                
                if (found) {
                    data.models.push(mData);
                }
            }
        }
    }

    res.send(JSON.stringify(data), 200, JSONt);
});

// TODO: Support model import without using tar, use zip and unzip?
routes.post('/model', function(req, res) {
    log('...handling route post /model');

    if (req.xhr && req.headers['content-type'] == 'application/octet-stream') {
        // if (!path.existsSync(uploadPath)) {
        //  fs.mkdirSync(uploadPath, 0755);
        // }

        // var fName = req.header('x-file-name'), 
        //  fSize = req.header('x-file-size'), 
        //  fType = req.header('x-file-type'), 
        //  tmpFile = uploadPath + '/' + fName,
        //  toDir = assetsPath + '/' + fName.split('.').shift(),
        //  origDir = toDir,
        //  ws = fs.createWriteStream(tmpFile),
        //  ext = fName.split('.').pop(),
        //  counter = 0;
            
        // req.on('data', function(data){
        //  ws.write(data);
        // });
        
        // if (ext === 'o3dtgz' || ext === 'tgz' || ext === 'zip') {
            
        //  while (path.existsSync(toDir)) {
        //      toDir = origDir + counter++;
        //  }
        //  fs.mkdirSync(toDir, 0755);
            
        //  var tarChild = child.spawn('tar', ['-C', toDir, '-xzf', tmpFile], {
        //      customFds: procFds
        //  });
            
        //  tarChild.on('exit', function(code){
        //      if (code === 0) {
        //          // Clean up the temp file
        //          fs.unlinkSync(tmpFile);
                    
        //          var mFiles = fs.readdirSync(toDir), 
        //              found = false, 
        //              retVal = {}, 
        //              urlDir = toDir.split('/');
                    
        //          urlDir.shift();
                    
        //          for (var j = 0, jl = mFiles.length; j < jl && !found; j++) {
        //              var mFile = mFiles[j];
                        
        //              if (mFile.match('.json')) {
        //                  retVal.name = urlDir[urlDir.length - 1];
        //                  retVal.url = urlDir.join('/') + '/' + mFile;
        //                  found = true;
        //              }
        //          }
                    
        //          res.send(retVal, 200);
        //      }
        //      else {
        //          res.send('Failed to upload file', 300);
        //          fs.unlinkSync(tmpFile);
        //      }
        //  });
        // } else {         
        //  res.send('File must be an archive file', 300);
        //  fs.unlinkSync(tmpFile);
        // }

        res.send('{}\n', 200, JSONt);
    } else {
        res.send('{}\n', 200, JSONt);
    }
});

routes.get(routes.PLUGINS, function(req, res) {
    log('...handling route GET ' + routes.PLUGINS);

    if (req.xhr) {
        var data = {
            plugins: []
        };
        
        if (path.existsSync(routes.pluginsPath)) {
            var files = fs.readdirSync(routes.pluginsPath);
            
            for (var i = 0, il = files.length; i < il; i++) {               
                var file = files[i],    
                    dir = routes.pluginsPath + '/' + file,
                    stat = fs.statSync(dir);
                
                if (stat.isDirectory()) {
                    var pFiles = fs.readdirSync(dir),
                        found = false;
                    
                    for (var j = 0, jl = pFiles.length; j < jl && !found; j++) {
                        var pFile = pFiles[j];
                        
                        if (pFile.match(file)) {
                            found = true;
                        }
                    }
                    
                    if (found) {
                        data.plugins.push(file);
                    }
                }
            }
        }
        
        res.send(JSON.stringify(data), 200, JSONt);
    } else {
        res.send('{}\n', 200, JSONt);
    }
});

routes.post(routes.PLUGINS, function(req, res) {
    log('...handling route POST ' + routes.PLUGINS);

    if (req.xhr) {      
        if (!path.existsSync(routes.pluginsPath)) {
            fs.mkdirSync(routes.pluginsPath, 0755);
        }
        
        var plugins = req.param['plugins'] || { 'plugins': [] },
            filePath = routes.pluginsPath + '/plugins.json';

        fs.writeFileSync(filePath, plugins);
        res.send(JSON.stringify({
            msg: 'Initial plugins updated'
        }), 200, JSONt);
    } else {
        res.send('{}\n', 200, JSONt);
    }
});

routes.post(routes.PUBLISH, function(req, res) {
    log('...handling route POST ' + routes.PUBLISH);

    if (req.xhr) {
        var name = req.param['name'],
            models = req.param['models'],
            filePath = routes.projectsPath + '/' + name + '.html',
            content = fs.readFileSync('PublishTemplate.html', 'utf8'),
            readme = fs.readFileSync('PublishReadMe', 'utf8'),
            start = content.indexOf('<!DOCTYPE');

        content = content.substr(start);
        fs.writeFileSync(filePath,
            content.replace(/%PROJECT%/g, 'projects/' + name)
                .replace(/%LOAD%/g, '..').replace(/%SCRIPT%/g, '../js'));
        
        // Create the published package directory
        var toDir = routes.projectsPath + '/' + name;
        var stat = fs.statSync(routes.projectsPath);
        fs.mkdirSync(toDir, stat.mode);
        fs.mkdirSync(toDir + '/assets', stat.mode);
        fs.mkdirSync(toDir + '/lib', stat.mode);
        copyFile('./public/js/hemi.min.js', toDir);
        copyFile('./public/js/o3d.min.js', toDir);
        copyFile('./public/js/lib/jshashtable.min.js', toDir + '/lib');
        copyFile(routes.projectsPath + '/' + name + '.json', toDir);
        fs.writeFileSync(toDir + '/README', readme.concat(models));
        fs.writeFileSync(toDir + '/' + name + '.html',
            content.replace(/%PROJECT%/g, name).replace(/%LOAD%/g, '.')
                .replace(/%SCRIPT%/g, '.'));
        res.send(JSON.stringify({
            name: name + '.html'
        }), 200, HTMLt);
    }
});


function getPathLessTheQueryString(url) {
    return url.indexOf('?') === -1 ? url : url.substring(0, url.indexOf('?'));
}

function getTheQueryString(url) {
    return url.indexOf('?') === -1 ? '' : url.slice(url.indexOf('?') + 1);
}

function req2ContentType(urlLessQueryString) {
    var at = urlLessQueryString.lastIndexOf('.'),
        fileType = at === -1 ? '.txt' : urlLessQueryString.slice(at),
        contentType = PLAINt;

    switch (fileType) {
    case '.css':
        contentType = 'text/css';
        break;
    case '.js':
        contentType = 'text/javascript';
        break;
    case '.htm':
    case '.html':
        contentType = HTMLt;
        break;
    case '.dae':
    case '.DAE':
        contentType = XMLt;
        break;
    case '.fx':
    case '.txt':
        contentType = PLAINt;
        break;
    case '.json':
        contentType = JSONt;
        break;
    case '.png':
        contentType = 'image/png';
        break;
    case '.jpeg':
    case '.jpg':
        contentType = 'image/jpeg';
        break;
    case '.gif':
        contentType = 'image/gif';
        break;
    case '.ico':
        contentType = 'image/x-icon';
        break;
    case '.woff':
        contentType = 'application/octet-stream';
        break;
    case '.mp4':
        contentType = 'video/mp4';
        break;
    case '.mp3':
        contentType = 'audio/mpeg';
        break;
    case '.ogg':
    case '.ogv':
        contentType = 'video/ogg';
        break;
    case '.webm':
        contentType = 'video/webm';
        break;
    default:
        log('unknown content type for ' + fileType);
    }

    return contentType;
}

var copyFile = function(srcFile, dstDir) {
    var data = fs.readFileSync(srcFile),
        newFile = dstDir + '/' + path.basename(srcFile);    
    fs.writeFileSync(newFile, data);
};

var app = http.createServer(function (hreq, hres) {
    var pltqs = getPathLessTheQueryString(hreq.url),
        req = {
            url: hreq.url,
            method: hreq.method,
            headers: hreq.headers,
            body: '',
            xhr: hreq.headers['x-requested-with'] == 'XMLHttpRequest',
            reqPath: decodeURIComponent(pltqs),
            contentType: req2ContentType(pltqs),
            queryString: getTheQueryString(hreq.url),
            param: undefined,
            httpReq: hreq,
        },
        res = {
            httpRes: hres,
            send: function(data, status, contentType) {
                this.httpRes.writeHead(status, { 'Content-Type': contentType });
                this.httpRes.end(data);
            }
        };

        hreq
            .on('data', function (data) {
                req.body += data;
            })
            .on('end', function () {
                req.param = qs.parse(req.queryString == '' ? req.body : req.queryString);
                routes.dispatch(req, res);
            });
});
app.listen(3000, "127.0.0.1");


if (opt_repl) {
    console.log('Kuda server interactive mode');

    var repl = require('repl'),
        svr = repl.start();

    svr.defineCommand('x', {
        help: 'Exit the interactive mode and server',
        action: function(code) {
            process.exit(code || 0);
        }
    });

    // TODO: Find a better way, but for now this will do.
    svr.context.qs = qs;
    svr.context.http = http;
    svr.context.fs = fs;
    svr.context.path = path;
    svr.context.JSONt = JSONt;
    svr.context.HTMLt = HTMLt;
    svr.context.PLAINt = PLAINt;
    svr.context.routes = routes;
}

if (opt_ws) {
    var WebSocketServer = require('WebSockets/websocket').server;
    var wsServer = new WebSocketServer({
        httpServer: app,
        // Firefox 7 alpha has a bug that drops the connection on large fragmented messages
        // JPP NOTE: We support FF7 stable, so leave this out, but still commented here
        //fragmentOutgoingMessages: false
    });

    wsServer.on('request', function(request) {
        log('...handling WebSocket connection request for ' + request.requestedProtocols.toString());

        for (var i = 0; i < request.requestedProtocols.length; i++) {
            if (routes.wss[request.requestedProtocols[i]]) {
                var connection = request.accept(request.requestedProtocols[i], request.origin);

                connection.on('close', function() {
                    log('WebSocket connection closed to ' + connection.remoteAddress);
                    var index = routes.wsConnections.indexOf(connection);

                    if (index !== -1) {
                        // remove the connection from the pool
                        routes.wsConnections.splice(index, 1);
                    }
                });

                log('WebSocket connection accepted for ' + connection.remoteAddress);
                routes.wss[request.requestedProtocols[i]](connection);
                routes.wsConnections.push(connection);
            } else {
                log('Unknown WebSocket protocol ' + request.requestedProtocols[i]);
            }       
        }
    });

    routes.ws(routes.WSEXAMPLE, function(connection) {
        log('...adding ' + routes.WSEXAMPLE + ' protocol request message handler');

        var intervalId = [],
            index = routes.wsConnections.length,
            imageFile = 'public/samples/imageTransfer/test.png',
            imageBase64 = fs.readFileSync(imageFile, 'base64'),
            data = JSON.stringify({
                msg: 'canvasImage',
                data: { img: this.imageBase64 }
            });

        intervalId[index] = setInterval(function () {
            connection.sendUTF(data);
        }, 1000);
        // Handle closed connections
        connection.on('close', function() {
            clearInterval(intervalId[index]);
        });
        // Handle incoming messages
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                try {
                    var command = JSON.parse(message.utf8Data);
                   
                    if (command.msg === 'stop') {
                        clearInterval(intervalId[index]);
                    } else {
                        console.log('Unknown command for ' + routes.WSEXAMPLE + ' on message');
                    }
                } catch(e) {
                    console.log(e)
                }
            }
        });
    });
}

console.log('Node ' + process.version + ' Kuda server running at http://localhost:3000/');
