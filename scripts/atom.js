'use strict';

var CompositeDisposable = require('atom').CompositeDisposable,
	shelljs = require('shelljs'),
	child_process = require('child_process'),
	path = require('path'),
	version = '1.0.0',
	jaeger_toolset_download_url = 'https://github.com/PsichiX/language-jaeger/releases';

function formatString(format, object)
{
	if(!format){
		return "";
	}
	return format.replace(/\$\{([a-zA-Z0-9_]+)\}/g,
		function(value, id)
		{
			var r = object[id];
			return typeof r === 'string' ? r : value;
		}
	);

}

function Jaeger() {

	this.config = {
		/*commandCheckSyntax: {
			title: 'Check syntax command',
			description: 'Command triggered on syntax check',
			type: 'string',
			default: 'jaeger ${FILE_PATH} -sd ${FILE_DIR}'
		},*/
		commandRunScript: {
			title: 'Run script command',
			description: 'Command triggered on script run',
			type: 'string',
			default: 'jaeger ${FILE_PATH} -sd ${FILE_DIR}'
		}
	};

}

Jaeger.prototype = Object.create(null);

Jaeger.prototype.config = null;
Jaeger.prototype.subscriptions = null;

Jaeger.prototype.activate = function(state){

	var subs = this.subscriptions = new CompositeDisposable();

	/*subs.add(atom.commands.add('atom-text-editor', 'jaeger:check-syntax', function(){
		this.onCheckSyntax();
	}.bind(this)));*/
	subs.add(atom.commands.add('atom-text-editor', 'jaeger:run', function(){
		this.onRun();
	}.bind(this)));
	/*subs.add(atom.commands.add('atom-text-editor', 'jaeger:compile', function(){
		this.onCompile();
	}.bind(this)));*/
	subs.add(atom.commands.add('*', 'jaeger:info', function(){
		this.onInfo();
	}.bind(this)));

};

Jaeger.prototype.deactivate = function(){

	this.subscriptions.dispose();
	this.subscriptions = null;

};

Jaeger.prototype.promiseCheckBinaries = function(){

	return new Promise(function(accept, reject){

		if(!shelljs.which('jaeger')){
			atom.notifications.addError('There is no Jaeger Toolset installed on this machine!', {
				detail: 'Please, download Jaeger Toolset from official releases webpage at GitHub.',
				dismissable: true
			});
			var platform = process.platform,
				cmd = '';
			if(platform === 'win32'){
				cmd = 'start ' + jaeger_toolset_download_url;
			}else if(platform === 'linux'){
				cmd = 'xdg-open ' + jaeger_toolset_download_url;
			}else if(platform === 'darwin'){
				cmd = 'open ' + jaeger_toolset_download_url;
			}
			shelljs.exec(cmd, {async: true});
			reject();
		}else{
			child_process.exec('jaeger -v', function(error, stdout, stderr){
				var r = /^Jaeger\s+v([0-9]+\.[0-9]+\.[0-9]+)/,
					m = stdout.match(r);
				if(m){
					if(m.length < 2 || m[1] !== version){
						atom.notifications.addError('Jaeger Toolset version does not match Atom language version supported!', {
							detail: 'Jaeger Toolset installed: ' + m[1] + '\nAtom language support: ' + version,
							dismissable: true
						});
						reject();
					}else{
						accept();
					}
				}else{
					reject();
				}
			});
		}

	});

};

/*Jaeger.prototype.promiseCheckSyntax = function(filePath){

	return new Promise(function(accept, reject){

		var dir = path.dirname(filePath),
			cmd = formatString(
				atom.config.get('language-jaeger.commandCheckSyntax'),
				{
					FILE_PATH: filePath,
					FILE_DIR: dir
				}
			);

		child_process.exec(cmd, {
			cwd: dir
		}, function(error, stdout, stderr){
			if(error){
				atom.notifications.addError(stdout, {
					dismissable: true
				});
				reject();
			}else{
				atom.notifications.addSuccess(filePath + ' is free from syntax errors!');
				accept();
			}
		});

	});

};*/

/*Jaeger.prototype.promiseCompileScript = function(filePath){

	return new Promise(function(accept, reject){

		atom.notifications.addError('COMPILATION TO NATIVE MODULE IS NOT YET IMPLEMENTED!', {
			dismissable: true
		});
		reject();

	});

};*/

Jaeger.prototype.promiseRunScript = function(filePath){

	return new Promise(function(accept, reject){

		var dir = path.dirname(filePath),
			cmd = formatString(
				atom.config.get('language-jaeger.commandRunScript'),
				{
					FILE_PATH: filePath,
					FILE_DIR: dir
				}
			),
			runScriptsInTerminalWindow = atom.config.get(
				'language-jaeger.runScriptsInTerminalWindow'
			),
			platform = process.platform;

		child_process.exec(cmd, {
			cwd: dir
		}, function(error, stdout, stderr){
			if(error){
				atom.notifications.addError('Running: ' + filePath, {
					detail: stdout,
					dismissable: true
				});
				reject();
			}else{
				atom.notifications.addSuccess('Running: ' + filePath, {
					detail: stdout,
					dismissable: true
				});
				accept();
			}
		});

	});

};

Jaeger.prototype.promiseShowInfo = function(filePath){

	return new Promise(function(accept, reject){

		var cmd = 'jaeger -v';

		child_process.exec(cmd, function(error, stdout, stderr){
			if(error){
				atom.notifications.addError(stdout, {
					dismissable: true
				});
				reject();
			}else{
				atom.notifications.addSuccess(stdout);
				accept();
			}
		});

	});

};

/*Jaeger.prototype.onCheckSyntax = function(){

	var editor = atom.workspace.getActivePaneItem(),
		file = editor ? editor.buffer.file : null,
		filePath = file ? file.path : null,
		ext = filePath ? path.extname(filePath) : null;

	if(ext !== '.jg'){
		return;
	}
	this.promiseCheckBinaries()
		.then(this.promiseCheckSyntax.bind(this, filePath))
		.catch(function(reason){
			if(reason){
				atom.notifications.addError(reason.toString(), {
					dismissable: true
				});
			}
		});

};*/

/*Jaeger.prototype.onCompile = function(){

	var editor = atom.workspace.getActivePaneItem(),
		file = editor ? editor.buffer.file : null,
		filePath = file ? file.path : null,
		ext = filePath ? path.extname(filePath) : null;

	if(ext !== '.jg'){
		return;
	}
	this.promiseCheckBinaries()
		.then(this.promiseCompileScript.bind(this, filePath))
		.catch(function(reason){
			if(reason){
				atom.notifications.addError(reason.toString(), {
					dismissable: true
				});
			}
		});

};*/

Jaeger.prototype.onRun = function(){

	var editor = atom.workspace.getActivePaneItem(),
		file = editor ? editor.buffer.file : null,
		filePath = file ? file.path : null,
		ext = filePath ? path.extname(filePath) : null;

	if(ext !== '.jg'){
		return;
	}
	this.promiseCheckBinaries()
		.then(this.promiseRunScript.bind(this, filePath))
		.catch(function(reason){
			if(reason){
				atom.notifications.addError(reason.toString(), {
					dismissable: true
				});
			}
		});

};

Jaeger.prototype.onInfo = function(){

	this.promiseCheckBinaries()
		.then(this.promiseShowInfo.bind(this))
		.catch(function(reason){
			if(reason){
				atom.notifications.addError(reason.toString(), {
					dismissable: true
				});
			}
		});

};

module.exports = new Jaeger();
