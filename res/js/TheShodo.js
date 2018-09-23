if (!window.TheShodo) {
	window.TheShodo = {};
}

(function($TS){

/*---------- TheShodo.storageBaseUrl ----------*/
$TS.storageBaseUrl = '';

/*---------- TheShodo.sharedBaseUrl ----------*/
$TS.sharedBaseUrl = '';

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
// if ($TS.UA.isAudioSupported) {
if (true) {
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