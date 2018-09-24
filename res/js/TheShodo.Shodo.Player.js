/// <reference path="TheShodo.js" />
/// <reference path="TheShodo.Shodo.Core.js" />
/// <reference path="TheShodo.Shodo.Resources.js" />

if (!TheShodo.Shodo) TheShodo.Shodo = {};

TheShodo.Shodo.Player = function(width, height, canvas, strokeData) {
    /// <summary></summary>
    /// <param name="width">target canvas width</param>
    /// <param name="height">target canvas height</param>
    /// <param name="canvas"></param>
    /// <param name="strokeData"></param>
    this.width = width;
    this.height = height;
    this.canvas = canvas;
    this.dummyCanvas = document.createElement('canvas');
    this.dummyCanvas.width = strokeData.Width; // original size
    this.dummyCanvas.height = strokeData.Height; // original size
    this.compositedCanvas = document.createElement('canvas');
    this.compositedCanvas.width = strokeData.Width; // original size
    this.compositedCanvas.height = strokeData.Height; // original size
    this.timer = null;
    this.state = TheShodo.Shodo.Player.PlayState.Stopped;
    this.strokeData = strokeData;
    this.strokeHistory = JSON.parse(strokeData.Strokes);
    this.strokeHistoryWork = [];
    this.currentStroke = [];
    this.strokeEngine = null;
    this.backgroundImage = null;
    this._speed = 1.25;

    if (strokeData.Version > 2)
        throw "Not Supported Version";
}
TheShodo.Shodo.Player.PlayState = {
    Stopped: 0,
    Playing: 1,
    Pausing: 2
}

TheShodo.Shodo.Player.prototype.setSpeed = function(value) {
    /// <summary></summary>
    /// <param name="value"></param>
    this._speed = value;
    if (this.state != TheShodo.Shodo.Player.PlayState.Stopped) {
        this.startTimer();
    }
}

TheShodo.Shodo.Player.prototype.getSpeed = function() {
    /// <summary></summary>
    return this._speed;
}

TheShodo.Shodo.Player.prototype.createCroppedBackgroundPaperImage = function(backgroundImage, width, height) {
    /// <summary></summary>
    var backgroundCanvas = document.createElement('canvas');
    backgroundCanvas.width = width;
    backgroundCanvas.height = height;

    var backgroundCanvasCtx = backgroundCanvas.getContext('2d');
    var ratio = backgroundCanvas.width / backgroundImage.naturalWidth;
    var imgHeight = Math.round(backgroundImage.naturalHeight * ratio);
    var top = imgHeight - backgroundCanvas.height;
    backgroundCanvasCtx.drawImage(backgroundImage, 0, -top, backgroundCanvas.width, backgroundCanvas.height + top);
    return backgroundCanvas;
}

TheShodo.Shodo.Player.prototype.onTick = function() {
    /// <summary></summary>
    if (this.state != TheShodo.Shodo.Player.PlayState.Playing)
        return;

    if (this.currentStroke.length == 0) {
        if (this.strokeHistoryWork.length == 0) {
            this.stop();
            return;
        }
        var op = this.strokeHistoryWork.shift();

        this.strokeEngine.endStroke();
        this.strokeEngine.beginStroke();

        switch (op.O) {
            case TheShodo.Shodo.StrokeManager.StrokeOperation.Stroke:
                this.currentStroke = Array.apply(null, op.D); // clone
                break;

            case TheShodo.Shodo.StrokeManager.StrokeOperation.SetBrush:
                this.strokeEngine.selectBrush(op.D);
                return;

            case TheShodo.Shodo.StrokeManager.StrokeOperation.SetOpacity:
                this.strokeEngine.setBrushOpacity(op.D);
                this.__currentOpacity = op.D; // TODO:
                return;

            case TheShodo.Shodo.StrokeManager.StrokeOperation.SetColor:
                this.strokeEngine.setBrushColor(op.D);
                return;
        }
    }

    var pos = this.currentStroke.shift();
    if (pos) {
        this.strokeEngine.addStrokePosition({ x: pos.X, y: pos.Y, t: pos.T, p: pos.P });
        this.strokeEngine.draw();
    }

    var ctx = this.canvas.getContext('2d');
    ctx.save();

    ctx.globalAlpha = 1;
    // set background
    if (this.backgroundImage) {
        ctx.drawImage(this.backgroundImage, 0, 0, this.backgroundImage.width, this.backgroundImage.height);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.drawImage(this.compositedCanvas,
        0, 0, this.dummyCanvas.width, this.dummyCanvas.height, /* src */
        0, 0, this.width, this.height /* dst */ );

    // emulate
    if (this.__currentOpacity) {
        ctx.globalAlpha = this.__currentOpacity;
    } else {
        ctx.globalAlpha = 1;
    }
    ctx.drawImage(this.dummyCanvas,
        0, 0, this.dummyCanvas.width, this.dummyCanvas.height, /* src */
        0, 0, this.width, this.height /* dst */ );
    ctx.restore();
}

TheShodo.Shodo.Player.prototype.startTimer = function() {
    /// <summary></summary>
    if (this.timer != null)
        clearInterval(this.timer);

    var self = this;
    this.timer = setInterval(function() { self.onTick(); }, 16 / this._speed);
}

TheShodo.Shodo.Player.prototype.play = function() {
    /// <summary></summary>
    if (this.state == TheShodo.Shodo.Player.PlayState.Stopped) {
        var ctx = $(this.canvas).get(0).getContext('2d');
        ctx.clearRect(0, 0, this.width, this.height);

        // render with original size
        this.strokeEngine = new TheShodo.Shodo.StrokeEngine(this.dummyCanvas.width, this.dummyCanvas.height, this.dummyCanvas, this.compositedCanvas);
        this.strokeHistoryWork = Array.apply(null, this.strokeHistory); // clone
        this.currentStroke = [];
    }

    // prepare Background (Resize & Crop)
    if (this.backgroundImage != null) {
        this.backgroundImage = this.createCroppedBackgroundPaperImage(this.backgroundImage, this.width, this.height);
    }

    this.state = TheShodo.Shodo.Player.PlayState.Playing;
    this.startTimer();

    if (this.onPlayStarted)
        this.onPlayStarted();
}

TheShodo.Shodo.Player.prototype.pause = function() {
    /// <summary></summary>
    this.state = TheShodo.Shodo.Player.PlayState.Pausing;

    if (this.onPaused)
        this.onPaused();
}


TheShodo.Shodo.Player.prototype.stop = function() {
    /// <summary></summary>
    this.state = TheShodo.Shodo.Player.PlayState.Stopped;
    clearInterval(this.timer);

    if (this.onStopped)
        this.onStopped();
}
