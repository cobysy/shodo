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

/*---------- TheShodo.isSignedIn ----------*/
$TS.isSignedIn = false;

/*---------- TheShodo.antiForgeryToken ----------*/
$TS.antiForgeryToken = { name:'TokenName', token:'AAAAAAAAAAAA' };

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

/*---------- not-webkit ----------*/
if (!$TS.UA.isWebKit) {
	$(function(){
		$('body').addClass('not-webkit');
	});
}

/*---------- browser alert ----------*/
if (!$TS.UA.isIEgte9) {
$(function(){
if (!$TS.isPanelContent && $('body').is('.home, .gallery, .signin, .write')) {
	var alertHTML = "";
	if ($TS.OS.isIE9Installable) {
		alertHTML = [
			  '<div class="useragent-alert">'
			, '<p>FUNCTION LIMITED. Get the best experience with Internet Explorer 10.</p>'
			, '<div class="link"><a href="http://www.beautyoftheweb.com" target="_blank">Beauty of the Web for Upgrading to Internet Explorer</a></div>'
			, '</div>'
		].join('');
	} else {
		alertHTML = [
			  '<div class="useragent-alert">'
			, '<p>FUNCTION LIMITED. Get the best experience with Internet Explorer 10.</p>'
			, '<div class="link"><a href="http://www.beautyoftheweb.com" target="_blank">Beauty of the Web for Upgrading to Internet Explorer</a> <span class="note">* Internet Explorer 9 requires Windows Vista or Windows 7.</span></div>'
			, '</div>'
		].join('');
	}
	$('body').addClass('alert-shown').prepend($(alertHTML));
}
});
}

/*---------- pinable ----------*/
$(function(){
	if (window == window.parent) {
		$(document).ready(function() {
			$('body').pinable({
				discStyle  : 'toast',
				closeTitle : 'Close',
				dragAlt    : 'Drag me!',
				message    : 'Drag this icon to your taskbar',
				elementId  : 'pinning-discoverability',
				logoPath   : TheShodo.sharedBaseUrl + '/shared/img/icon_pin_01.png'
			});
		});
	}
});

/*---------- TheShodo.ENV ----------*/
$TS.ENV = {};
$TS.ENV.volume  = 0.5;
$TS.ENV.muted   = false;
$TS.ENV.players = [];
$TS.ENV.handlers = [];
$TS.ENV.setVolume = function(volume, muted, noStorage){
	volume = Math.max(Math.min(volume, 1), 0);
	muted  = (!volume || muted) ? true : false;
	if (muted) {
		volume = 0;
	}
	if (this.volume != volume || this.muted != muted) {
		this.volume = volume;
		this.muted  = muted;
		if (window.localStorage) {
			if (this.storageTimer) {
				clearTimeout(this.storageTimer);
				this.storageTimer = null;
			}
			if (!noStorage) {
				this.storageTimer = setTimeout(function(){
					$TS.ENV.save();
				}, 100);
			}
		}
		this.players.forEach(function(player, index, array){
			player.volume = volume;
			player.muted  = muted;
		}, this);
		this.handlers.forEach(function(func, index, array){
			func(volume, muted);
		}, this);
	}
};
$TS.ENV.addPlayer = function(player){
	player.volume = this.volume;
	player.muted  = this.muted;
	this.players.push(player);
};
$TS.ENV.load = function(){
	var storage = window.localStorage;
	if (storage && storage["TheShodo.volume"] && storage["TheShodo.muted"]) {
		this.setVolume(
			  parseFloat(storage["TheShodo.volume"], 10)
			, storage["TheShodo.muted"] == 'true' ? true : false
			, 'noStorage'
		);
	}
};
$TS.ENV.save = function(){
	var storage = window.localStorage;
	if (storage) {
		var volume = this.volume.toString(10);
		var muted  = this.muted.toString();
		if (storage["TheShodo.volume"] != volume) storage["TheShodo.volume"] = volume;
		if (storage["TheShodo.muted"]  != muted)  storage["TheShodo.muted"]  = muted;
	}
};

if ($TS.UA.isAudioSupported) {
	$TS.ENV.load();
	if (window.localStorage) {
		window.addEventListener('storage', function(e){
			if (!e.key || (e.key == "TheShodo.volume" || e.key == "TheShodo.muted")) {
				$TS.ENV.load();
			}
		}, false);
	}
	$(function(){
		$('video,audio').each(function(index, node){
			$TS.ENV.addPlayer(node);
		});
		$('video,audio').live('volumechange', function(){
			$TS.ENV.setVolume(this.volume, this.muted);
		});
	});
}


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


/*---------- TheShodo.JSAPI ----------*/
$TS.JSAPI = function(url){
	this.url          = '';
	this.isActive     = false;
	this.targetWindow = null;
	this.stack        = [];
	this.initTimer    = null;
	this.init(url);
}
$TS.JSAPI.prototype.init = function(url){
	if (typeof window.postMessage == 'function') {
		this.url = url || '';
		this.callbacks = {};
		window.addEventListener('message', $TS.createDelegate(function(e){
			if (e.source === this.targetWindow) {
				if (e.data == "initialize") {
					if (!this.isActive) {
						window.clearInterval(this.initTimer);
						this.initTimer = null;
						this.isActive  = true;
						this.onRegist();
						this.stack.forEach(function(item, index, array){
							this.postMessage(item.data, item.origin);
						}, this);
						this.stack.length = 0;
					}
				} else {
					var response = JSON.parse(e.data);
					this.doCallback(response);
				}
			}
		}, this), false);
		if (this.url) {
			this.regist();
		}
	}
}
if (typeof window.postMessage == 'function') {
	$TS.JSAPI.prototype.regist = function(){
		if (this.url) {
			$($TS.createDelegate(function(){
				var APIFrame = $('<iframe></iframe>').hide();
				APIFrame.bind('load', $TS.createDelegate(function(e){
					this.targetWindow = e.target.contentWindow;
					this.initTimer = window.setInterval($TS.createDelegate(function(){
						this.targetWindow.postMessage("initialize", "*");
					}, this), 1);
					APIFrame.unbind('load');
				}, this));
				APIFrame.appendTo('body').attr('src', this.url);
			}, this));
		}
	};
	$TS.JSAPI.prototype.postMessage = function(data, origin){
		if (this.isActive && this.targetWindow) {
			this.targetWindow.postMessage(data.toString(), origin || '*');
		} else {
			this.stack.push({data:data, origin:origin});
		}
	};
	$TS.JSAPI.prototype.addCallback = function(type, func, aThis){
		if (!this.callbacks[type]) {
			this.callbacks[type] = [];
		}
		this.callbacks[type].push($TS.createDelegate(func, aThis));
	};
	$TS.JSAPI.prototype.removeCallback = function(type, func, aThis){
		if (!this.callbacks[type]) {
			return;
		}
		this.callbacks[type] = this.callbacks[type].filter(function(delegate, index, array){
			return (delegate.func !== func || delegate.aThis !== aThis);
		});
	};
	$TS.JSAPI.prototype.doCallback = function(response){
		var callbacks = this.callbacks[response.type];
		if (callbacks) {
			callbacks.forEach(function(func, index, array){
				func(response);
			});
		}
	};
	$TS.JSAPI.prototype.onRegist = function(){
	};

	$TS.JSAPI.MessageData = function(id, type, data) {
		this.id   = id || "";
		this.type = type || "";
		this.data = data.toString() || "";
	}
	$TS.JSAPI.MessageData.prototype.toString = function(){
		return JSON.stringify(this);
	}
}

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
		if ($TS.UA.isWebKit) {
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
		}
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

/*---------- TheShodo.SoundControl ----------*/
	$TS.SoundControl = function(){
		this.node = null;
		this.muteNode = null;
		this.barNode = null;
		this.muted = null;
		this.init();
	}
	$TS.SoundControl.prototype.init = function(){
		this.node = $('<div class="sound-control"></div>');
		this.muteNode = $('<div class="mute"></div>').appendTo(this.node);
		this.barNode = $('<div class="bar"></div>').appendTo(this.node);

		this.muteNode
			.bind('click', $TS.createDelegate(function(e){
				this.toggleMute();
			}, this))
		;
		this.barNode
			.bind('select', $TS.createDelegate(function(e){
				e.preventDefault();
			}, this))
			.bind('mousedown', $TS.createDelegate(function(e){
				e.preventDefault();
				this.barNode.data('mousedown', true);
			}, this))
			.bind('mouseup', $TS.createDelegate(function(e){
				$TS.ENV.setVolume(this.posToVolume(e.pageX - this.barNode.offset().left));
			}, this))
		;
		$(document)
			.bind('mouseup', $TS.createDelegate(function(e){
				this.barNode.data('mousedown', false);
			}, this))
			.bind('mousemove', $TS.createDelegate(function(e){
				if (this.barNode.data('mousedown')) {
					$TS.ENV.setVolume(this.posToVolume(e.pageX - this.barNode.offset().left));
				}
			}, this))
		;

		$TS.ENV.handlers.push($TS.createDelegate(this.onChange, this));
		this.onChange();
		$($TS.createDelegate(function(){
			if ($('body').is('.home')) {
				$('.site-information .rights').after(this.node);
			} else {
				$('.site-information .utilities .user-info').after(this.node);
			}
		}, this));
	}
	$TS.SoundControl.prototype.posToVolume = function(x){
		return Math.max(Math.min((x - 4) / 77, 1), 0);
	}
	$TS.SoundControl.prototype.toggleMute = function(){
		$TS.ENV.setVolume($TS.ENV.volume || 0.5, !$TS.ENV.muted);
	}
	$TS.SoundControl.prototype.onChange = function(){
		var muted  = $TS.ENV.muted;
		var volume = !muted ? Math.max(Math.min($TS.ENV.volume, 1), 0) : 0;
		var seek   = parseInt(77 * volume) + 3;
		var bar    = -1 * (77 - parseInt(77 * volume));
		this.barNode.css('background-position', seek + 'px 50%, 0 50%, ' + bar + 'px 50%, 3px 50%');
		if (muted) {
			this.node.addClass('pseudo-muted');
		} else {
			this.node.removeClass('pseudo-muted');
		}
	}
	new $TS.SoundControl();
}

/*---------- Tech-review ----------*/
$('ul.sub-contents a.panel-content').live('click', function(e){
	e.preventDefault();
	if ($TS.FloatingPanel && !$TS.TechReviewPanel) {
		$TS.TechReviewPanel = new $TS.FloatingPanel('Tech-review from Business Architects', '<iframe src="/TechReview" frameborder="0" framespacing="0" width="852" height="426"></iframe>', {
			className : 'tech-review-dialog'
		});
		$TS.TechReviewPanel.onBeforePanelShow = function(){
			$('body').addClass('panel-opened');
		};
		$TS.TechReviewPanel.onPanelClosed = $TS.createDelegate(function(){
			$('body').removeClass('panel-opened');
			if ($TS.UA.isAudioSupported) {
				var targetWindow = this.content.get(0).contentWindow;
				if (targetWindow && targetWindow.jQuery) {
					targetWindow.jQuery('video,audio').each(function(index, node){
						node.pause();
					});
				}
			}
		}, $TS.TechReviewPanel);
	}
	if ($TS.TechReviewPanel) {
		$TS.TechReviewPanel.show();
	}
});

})(window.TheShodo);