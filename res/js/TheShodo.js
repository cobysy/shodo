if (!window.TheShodo) {
	window.TheShodo = {};
}

(function($TS){

/*---------- Array.forEach ----------*/
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(func /*, thisp*/) {
		if (typeof func != "function") throw new TypeError();
		var thisp = arguments[1];
		for (var i = 0, n = this.length; i < n; i++) {
			if (i in this) func.apply(thisp, [this[i], i, this]);
		}
	};
}

/*---------- Array.map ----------*/
if (!Array.prototype.map) {
	Array.prototype.map = function(fun /*, thisp*/) {
		var len = this.length;
		if (typeof fun != "function")
			throw new TypeError();
	
		var res = new Array(len);
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in this)
				res[i] = fun.call(thisp, this[i], i, this);
		}
		return res;
	};
}

/*---------- ready ----------*/
var _d = document;
var ua = navigator.userAgent;

var canvas = _d.createElement('canvas');
var video  = _d.createElement('video');
var audio  = _d.createElement('audio');

/*---------- TheShodo.storageBaseUrl ----------*/
$TS.storageBaseUrl = '';

/*---------- TheShodo.sharedBaseUrl ----------*/
$TS.sharedBaseUrl = '';

/*---------- TheShodo.UA ----------*/
$TS.UA = {};
$TS.UA.isCanvasSupported   = (canvas && canvas.getContext && canvas.getContext('2d')) ? true : false;
$TS.UA.isVideoSupported    = (video  && video.canPlayType) ? true : false;
$TS.UA.isAudioSupported    = (audio  && audio.canPlayType) ? true : false;
$TS.UA.isGecko             = (ua.indexOf(' Gecko/') != -1) ? true : false;
$TS.UA.isWebKit            = (ua.indexOf(' AppleWebKit/') != -1) ? true : false;
$TS.UA.isIE                = (ua.indexOf('MSIE') != -1 || ua.indexOf('Trident') != -1) ? true : false;
$TS.UA.isIEgte9            = ($TS.UA.isIE && _d.documentMode >= 9) ? true : false;
$TS.UA.isHTML5Supported    = function (elementName, attrName) { return (attrName in _d.createElement(elementName)); }
$TS.UA.isSVGSupported      = (_d.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Shape", "1.0") || _d.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1"));
$TS.UA.isCSS3CalcSupported = (function () { var e = document.createElement('div'); e.style.cssText = 'width: calc(10px + 10px)'; return e.style.cssText.match('calc'); })();
$TS.UA.isSiteMode          = (function () { try { return (window.external && window.external.msIsSiteMode()); } catch (e){ } return false; })();
$TS.OS = {};
$TS.OS.isWindows        = (ua.indexOf('Windows') != -1) ? true : false;
$TS.OS.isMac            = (ua.indexOf('Mac')     != -1) ? true : false;
$TS.OS.isIE9Installable = ($TS.OS.isWindows && parseFloat((ua.match(/Windows NT (\d+\.\d+)/) || ['',''])[1], 10) >= 6) ? true : false;

/*---------- TheShodo.isPanelContent ----------*/
$TS.isPanelContent = false;
try {
	$TS.isPanelContent = (window.parent && window.parent !== window.window && window.parent.location.host.replace(/:[0-9]+/,'') == location.host.replace(/:[0-9]+/,''));
} catch(err) {};

/*---------- TheShodo.createDelegate ----------*/
$TS.createDelegate = function(func, aThis){
	var delegate = function(){
		var _delegate = arguments.callee;
		return _delegate.func.apply(_delegate.aThis, arguments);
	}
	delegate.func  = func;
	delegate.aThis = aThis;
	return delegate;
}

/*---------- TheShodo.createDataFromForm ----------*/
$TS.createDataFromForm = function(formE){
	var data = {};
	for (var i = 0, n = formE.length; i < n; i++) {
		var e = formE[i];
		if (e.type == 'checkbox' || e.type == 'radio') {
			data[e.name] = (e.checked != '' && e.checked != null);
		} else {
			data[e.name] = e.value;
		}
	}
	return data;
}

/*---------- TheShodo.requestAnimationFrame ----------*/
$TS.requestAnimationFrame = (function () { 
	return $TS.createDelegate(
	           window.requestAnimationFrame            ||
	           window.msRequestAnimationFrame          ||
	           window.mozRequestAnimationFrame         ||
	           window.webkitRequestAnimationFrame      ||
	           window.oRequestAnimationFrame           ||
	           function (proc) { return setTimeout(proc, 1); }
	       , window);
})();

/*---------- TheShodo.timerCompatibleRequestAnimationFrame ----------*/
$TS.timerCompatibleRequestAnimationFrame = (function () {
	"use strict";
	var _requestAnimationFrame = (function () {
		var method = window.requestAnimationFrame       ||
					 //window.msRequestAnimationFrame     ||
					 window.webkitRequestAnimationFrame ||
					 window.oRequestAnimationFrame      ||
					 window.mozRequestAnimationFrame    ||
					 function (func) { return setTimeout(func, 1000/60); };
		return function () { return method.apply(window, arguments); }
	})();
	var _cancelAnimationFrame = (function () {
		var method = window.cancelAnimationFrame       ||
					 //window.msCancelAnimationFrame     ||
					 window.webkitCancelAnimationFrame ||
					 window.oCancelAnimationFrame      ||
					 window.mozCancelAnimationFrame    ||
					 function (id) { return clearTimeout(id); };
		return function () { return method.apply(window, arguments); }
	})();
	
	var timerIdSeq = 0;
	var timers = {};
	
	function _setInterval(func, interval) {
		var timerId = ++timerIdSeq;
		//if (window.console && window.console.log) window.console.log('_setInterval: '+timerId);
		var loopFunc = function () {
			if (!timers[timerId]) return;
			func();
			if (!timers[timerId]) return;
			timers[timerId] = _requestAnimationFrame(loopFunc);
			//if (window.console && window.console.log) window.console.log('_setInterval/_requestAnimationFrame: '+timers[timerId]);
		}
		timers[timerId] = _requestAnimationFrame(loopFunc);
		//if (window.console && window.console.log) window.console.log('_setInterval/_requestAnimationFrame(1st): '+timers[timerId]);
		return timerId;
	}
	
	function _clearInterval(id) {
		//if (window.console && window.console.log) window.console.log('_clearInterval: '+id+'/'+timers[id]);
		if (timers[id]) {
			_cancelAnimationFrame(timers[id]);
		}
		timers[id] = null;
	}
	
	return { setInterval: _setInterval, clearInterval: _clearInterval, setTimeout: _requestAnimationFrame, clearTimeout: _cancelAnimationFrame };
})();

/*---------- TheShodo.BGM ----------*/
if ($TS.UA.isAudioSupported) {
	$TS.BGM = {};
	$TS.BGM.isEnabled = !$TS.isPanelContent;
	$TS.BGM.init = function(){
		var audio = $('audio.bgm');
		this.player = audio.get(0);
		if (!this.player) {
			this.isEnabled = false;
			return;
		}
		this.player.loop = true;
		// this.player.addEventListener('canplay', function () {
		// 	this.play();
		// });
		/*if ($TS.UA.isWebKit) {
			this.player.addEventListener('canplay', $TS.createDelegate(function(){
				this.player.volume = 0;
				this.player.muted  = true;
				this.play();
			}, this), false);
			this.player.addEventListener('play', $TS.createDelegate(function(){
				setInterval($TS.createDelegate(function(){
					this.player.volume = 0;
					this.player.muted  = true;
					this.player.volume = $TS.ENV.volume;
					this.player.muted  = $TS.ENV.muted;
				}, this), 100);
			}, this), false);
		} else {
			this.player.addEventListener('canplay', $TS.createDelegate(function(){
				this.play();
			}, this), false);
		}
		if ($TS.UA.isGecko) {
			this.player.addEventListener('ended', $TS.createDelegate(function(){
				this.player.currentTime = 0;
			}, this), false);
		}*/
		this.load();
	};
	$TS.BGM.load = function(){
		this.player.load();
	};
	$TS.BGM.play = function(){
		this.player.play();
	};
	$(function(){
		if ($TS.BGM.isEnabled) {
			$TS.BGM.init();
		}
	});
}

})(window.TheShodo);