/// <reference path="TheShodo.js" />
/// <reference path="TheShodo.Shodo.Resources.js" />

if (!window.TheShodo) window.TheShodo = {};

TheShodo.Shodo = {}

TheShodo.Shodo.StrokeManager = function (eventCaptureTarget, strokeEngine) {
    /// <summary></summary>
    /// <return>TheShodo.Shodo.StrokeManager</return>
    this.eventCaptureTarget  = eventCaptureTarget;
    this.strokeEngine        = strokeEngine;
    this.timerObservable     = null;
    this.timerInterval       = 1000 /*/ 60*/;
    this.handElementSelector = '#hand-image';
    this.strokeHistory       = [];
    this.isHandVisible       = false;
    this.isInStroke          = false;
    this.strokeBeginTime     = null;
    this.isLocked            = false;
}

TheShodo.Shodo.StrokeManager.StrokeOperation = {
    Stroke    : 0,
    SetOpacity: 1,
    SetBrush  : 2,
    SetColor  : 3
}

TheShodo.Shodo.StrokeManager.prototype.lock = function () {
    this.isLocked = true;
}

TheShodo.Shodo.StrokeManager.prototype.unlock = function () {
    this.isLocked = false;
}

TheShodo.Shodo.StrokeManager.prototype.selectBrush = function (brushName) {
    /// <summary>Select a brush.</summary>
    if (this.isLocked) return;

    this.endStroke();
    this.strokeHistory.push({
        O: TheShodo.Shodo.StrokeManager.StrokeOperation.SetBrush,
        D: brushName
    });

    return this.strokeEngine.selectBrush(brushName);
}

TheShodo.Shodo.StrokeManager.prototype.getCurrentBrush = function () {
    /// <summary>Get a current selected brush.</summary>
    return this.strokeEngine.getCurrentBrush().name;
}

TheShodo.Shodo.StrokeManager.prototype.setBrushOpacity = function (value) {
    /// <summary>set a brush opacity.</summary>
    if (this.isLocked) return;

    this.endStroke();
    this.strokeHistory.push({
        O: TheShodo.Shodo.StrokeManager.StrokeOperation.SetOpacity,
        D: value
    });
    
    return this.strokeEngine.setBrushOpacity(value);
}

TheShodo.Shodo.StrokeManager.prototype.getBrushOpacity = function () {
    /// <summary>get a brush opacity.</summary>
    return this.strokeEngine.getBrushOpacity();
}
TheShodo.Shodo.StrokeManager.prototype.setBrushColor = function (value) {
    /// <summary>set a brush color.</summary>
    if (this.isLocked) return;

    this.endStroke();

    this.strokeHistory.push({
        O: TheShodo.Shodo.StrokeManager.StrokeOperation.SetColor,
        D: value
    });

    return this.strokeEngine.setBrushColor(value);
}

TheShodo.Shodo.StrokeManager.prototype.getBrushColor = function () {
    /// <summary>get a brush color.</summary>
    return this.strokeEngine.getBrushColor();
}

TheShodo.Shodo.StrokeManager.prototype.toDataURL = function (type) {
    /// <summary>Get Image data URI</summary>
    return this.strokeEngine.toDataURL(type);
}

TheShodo.Shodo.StrokeManager.prototype.clearHistory = function () {
    /// <summary>Clear Stroke History</summary>
    /// <return>TheShodo.Shodo.StrokeManager</return>
    if (this.isLocked) return;

    this.endStroke();
    this.strokeHistory = [];
    this.strokeEngine.clear();

    // set current style to History
    this.setBrushOpacity(this.getBrushOpacity());
    this.setBrushColor(this.getBrushColor());
    this.selectBrush(this.getCurrentBrush());

    return this;
}

TheShodo.Shodo.StrokeManager.prototype.beginStroke = function () {
    /// <summary>Begin state of one stroke</summary>
    /// <return>TheShodo.Shodo.StrokeManager</return>
    if (this.isLocked) return;

    this.endStroke();

    this.isInStroke = true;
    this.strokeBeginTime = new Date().valueOf();
    this.currentStroke = [];
    this.strokeEngine.beginStroke();

    return this;
}

TheShodo.Shodo.StrokeManager.prototype.addStrokePosition = function (x, y, pressure) {
    /// <summary>Add stroke position to history and render</summary>
    /// <return>TheShodo.Shodo.StrokeManager</return>
    if (this.isLocked) return;
    
    var pos = { x: x, y: y, t: new Date().valueOf() - this.strokeBeginTime, p: pressure };
    this.currentStroke.push(pos);
    this.strokeEngine.addStrokePosition(pos);
    this.strokeEngine.draw();

    //console.log(pos.x + ', ' + pos.y);

    return this;
}

TheShodo.Shodo.StrokeManager.prototype.endStroke = function () {
    /// <summary>End state of one stroke</summary>
    /// <return>TheShodo.Shodo.StrokeManager</return>
    if (this.isLocked) return;

    if (!this.isInStroke) return;

    this.strokeHistory.push({
        O: TheShodo.Shodo.StrokeManager.StrokeOperation.Stroke,
        D: this.currentStroke.map(function (e) { return { X:e.x, Y:e.y, T:e.t, P:e.p }; }) // convert format
    });
    this.isInStroke = false;
    this.currentStroke = null;
    this.strokeEngine.endStroke();

    return this;
}

TheShodo.Shodo.StrokeManager.prototype.undoStroke = function () {
    /// <summary>Undo Stroke</summary>
    /// <return>TheShodo.Shodo.StrokeManager</return>
    if (this.isLocked) return;

    throw "NotSupported";

    this.strokeEngine.endStroke();
    this.strokeHistory.pop();
    this.currentStroke = null;
    this.strokeEngine.undoStroke();

    return this;
}

TheShodo.Shodo.StrokeManager.prototype.start = function () {
    /// <summary></summary>
    /// <return>TheShodo.Shodo.StrokeManager</return>
    var handCanvasObject = $(this.eventCaptureTarget);
    var handCanvas = handCanvasObject.get(0);
    $('body .content')
        .live('mousemove', function(e) {
            handCanvasObject.trigger('mouseup', e);
        })
    ;

    var self = this;
    var isMouseDown = false;

    var handE = $(this.handElementSelector);
    var offset = handCanvasObject.offset();

    if (window.navigator.msPointerEnabled) {
        handCanvasObject[0].addEventListener('MSPointerDown', function (e) {
            if (!e.isPrimary) return;

            e.preventDefault();
            isMouseDown = true;

            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;
            handE.css('top', y);
            handE.css('left', x);

            if (self.isHandVisible)
                handE.fadeIn('fast');

            self.beginStroke();
        }, false);
        handCanvasObject[0].addEventListener('MSPointerMove', function (e) {
            if (!e.isPrimary) return;
            if (!isMouseDown) return;

            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;

            if (e.pressure == 0 && e.pointerType == 0x00000003 /* MSPOINTER_TYPE_PEN */) return;

            self.addStrokePosition(x, y, e.pressure);

            handE.css('top', y);
            handE.css('left', x);
        }, false);
        handCanvasObject[0].addEventListener('MSPointerUp', function (e) {
            if (!e.isPrimary) return;

            e.preventDefault();
            if (!isMouseDown) return;
            isMouseDown = false;

            self.endStroke();
            
            if (self.isHandVisible)
                handE.fadeOut('fast');
        }, false);
    } else {
        handCanvasObject
            .on('mousedown', function(e) {
                e.preventDefault();
                isMouseDown = true;

                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                handE.css('top', y);
                handE.css('left', x);

                if (self.isHandVisible)
                    handE.fadeIn('fast');

                self.beginStroke();
            })
            .on('mousemove', function (e) {
                e.preventDefault(); e.stopPropagation();
                if (!isMouseDown) return;

                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;

                self.addStrokePosition(x, y);

                handE.css('top', y);
                handE.css('left', x);
            })
            .on('mouseup', function(e) {
                e.preventDefault();
                if (!isMouseDown) return;
                isMouseDown = false;

                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;

                self.endStroke();
            
                if (self.isHandVisible)
                    handE.fadeOut('fast');
            })
        ;
    }
}

// ----------------------------------------------------------------------------

TheShodo.Shodo.StrokeEngine = function (width, height, canvas, compositedCanvas) {
    /// <summary></summary>
    /// <return>TheShodo.Shodo.StrokeEngine</return>
    this.velocityPressureCoff = 5;
    this.canvas = $(canvas);
    this.width = width;
    this.height = height;
    this.canvasContext = this.canvas.get(0).getContext('2d');
    
    this.backgroundImage = null;
    this.backgroundImageClipping = { top: -43, left: 0 };

    this.brushOpacity = 1;
    this.brushColor = 0x000000;
    this.selectBrush('Medium');

    this.bufferingSize = 4;
    this.strokeBuffer = [];
    this.splineBuffer = [];
    this.previousPosition = null;
    this.previousBrushSize = null;
    this.previousVelocity = 0;
    this.previousDistance = 0;
    this.expectedNextPosition = null;
    this.accelerate = 0;

    this.compositedCanvas = compositedCanvas;
    this.compositedCanvasContext = this.compositedCanvas.getContext('2d');

    this.onImageCreated = function (canvas) {};

    this.clear();
}

TheShodo.Shodo.StrokeEngine.prototype.toDataURL = function (type) {
    /// <summary>Get Image data URI</summary>
    this.compositeCanvas();
    return this.getImage().toDataURL(type || 'image/png');
}

TheShodo.Shodo.StrokeEngine.prototype.clear = function () {
    /// <summary>Clear Canvas</summary>
   this.canvasContext.clearRect(0, 0, this.width, this.height);
   
   this.compositedCanvasContext.save();
   //this.compositedCanvasContext.fillStyle = '#ffffff';
   //this.compositedCanvasContext.fillRect(0, 0, this.width, this.height);
   this.compositedCanvasContext.clearRect(0, 0, this.width, this.height);
   this.compositedCanvasContext.restore();
}

TheShodo.Shodo.StrokeEngine.prototype.createColoredBrushImage = function (originalBrushImage, brushColor, width, height) {
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    var ctx = tmpCanvas.getContext('2d');
    ctx.drawImage(originalBrushImage, 0, 0);
    var imageData = ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);

    for (var i = 0, n = imageData.data.length / 4; i < n; i++) {
        imageData.data[(i * 4)] = (brushColor & 0xff0000) >> 16;
        imageData.data[(i * 4) + 1] = (brushColor & 0x00ff00) >> 8;
        imageData.data[(i * 4) + 2] = (brushColor & 0x0000ff);
    }
    ctx.putImageData(imageData, 0, 0);

    // 合成する
    var tmpCanvas2 = document.createElement('canvas');
    tmpCanvas2.width = width;
    tmpCanvas2.height = height;
    var ctx2 = tmpCanvas2.getContext('2d');
    for (var i = 0; i < 15; i++) {
        ctx2.drawImage(tmpCanvas, 0, 0);
    }

    var img = document.createElement('img');
    img.src = tmpCanvas2.toDataURL();

    return img;
}
TheShodo.Shodo.StrokeEngine.prototype.refreshBrush = function () {
    /// <summary>Create a brush.</summary>
    var newBrush = TheShodo.Shodo.Brushes.getBrush(this.brushName);
    newBrush.image = this.createColoredBrushImage(newBrush.image, this.brushColor, newBrush.width, newBrush.height);
    newBrush.kasureImage = this.createColoredBrushImage(newBrush.kasureImage, this.brushColor, newBrush.width, newBrush.height);
    this.currentBrush = newBrush;
}

TheShodo.Shodo.StrokeEngine.prototype.getImage = function (withoutBackground) {
    /// <summary>Get a completion image</summary>

    if (withoutBackground)
        return this.compositedCanvas;

    // create background canvas
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = this.width;
    tmpCanvas.height = this.height;
    var ctx = tmpCanvas.getContext('2d');

    // set background
    if (this.backgroundImage) {
        ctx.drawImage(this.backgroundImage,
                      0, 0,
                      this.backgroundImage.width, this.backgroundImage.height);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    }
    // draw composited canvas
    ctx.drawImage(this.compositedCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
    
    // callback
    if (this.onImageCreated) { this.onImageCreated(tmpCanvas); }

    return tmpCanvas;
}
TheShodo.Shodo.StrokeEngine.prototype.compositeCanvas = function () {
    // copy to Background
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = this.width;
    tmpCanvas.height = this.height;
    // WORKAROUND: IE9
    tmpCanvas.getContext('2d').fillRect(0, 0, 0, 0);
    this.canvas.get(0).getContext('2d').fillRect(0, 0, 0, 0);

    // writeCanvas -(w/alpha)-> tmpCanvas
    var tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.globalAlpha = this.brushOpacity;
    tmpCtx.drawImage(this.canvas.get(0), 0, 0);
    // tmpCanvas -> compositedCanvas
    this.compositedCanvasContext.drawImage(tmpCanvas, 0, 0);
    // clear writeCanvas
    this.canvasContext.clearRect(0, 0, this.width, this.height);
}

TheShodo.Shodo.StrokeEngine.prototype.setBrushOpacity = function (brushOpacity) {
    /// <summary>Set a brush opacity.</summary>
    // set new opacity
    this.brushOpacity = brushOpacity;
    //this.createBrushWithOpacity(this.currentBrush.name, brushOpacity);
    this.canvas.css('opacity', this.brushOpacity);
}

TheShodo.Shodo.StrokeEngine.prototype.getBrushOpacity = function () {
    /// <summary>Get a brush opacity.</summary>
    return this.brushOpacity;
}

TheShodo.Shodo.StrokeEngine.prototype.setBrushColor = function (brushColor) {
    /// <summary>Set a brush color.</summary>
    // set new opacity
    this.brushColor = brushColor;
    this.refreshBrush();
}

TheShodo.Shodo.StrokeEngine.prototype.getBrushColor = function () {
    /// <summary>Get a brush color.</summary>
    return this.brushColor;
}

TheShodo.Shodo.StrokeEngine.prototype.selectBrush = function (brushName) {
    /// <summary>Select a brush</summary>
    this.brushName = brushName;
    this.refreshBrush();
}

TheShodo.Shodo.StrokeEngine.prototype.getCurrentBrush = function () {
    /// <summary>Get a current brush</summary>
    return this.currentBrush;
}

// -----
TheShodo.Shodo.StrokeEngine.prototype.beginStroke = function () {
    /// <summary></summary>
    this.strokeBuffer = [];
    this.splineBuffer = [];
    this.previousPosition = null;
    this.previousBrushSize = null;
    this.previousVelocity = 0;
    this.previousDistance = 0;
    this.expectedNextPosition = null;
    this.accelerate = 0;

    //console.log('beginStroke');
}

TheShodo.Shodo.StrokeEngine.prototype.addStrokePosition = function (pos) {
    /// <summary></summary>
    /// <param name="pos">a point</param>
    this.strokeBuffer.push(pos);
}

TheShodo.Shodo.StrokeEngine.prototype.endStroke = function () {
    /// <summary></summary>

    if (this.accelerate > 1) {
        // はらい
        var pos = {
            x: this.expectedNextPosition.x,
            y: this.expectedNextPosition.y,
            t: (this.accelerate/(this.previousDistance * this.previousVelocity)) + this.previousPosition.t,
            p: this.previousPosition.p * Math.min(this.accelerate/(this.previousDistance * this.previousVelocity), 1)
        };
        for (var i = 0, n = this.bufferingSize; i < n; i++) {
            this.strokeBuffer.push(pos);
        }
        this.draw(true);
        //console.log('endStroke: this.previousVelocity=%d, this.accelerate=%d, this.previousDistance=%d', this.previousVelocity, this.accelerate, this.previousDistance);
    }

    this.compositeCanvas();

    //console.log('endStroke');
}
// -----

TheShodo.Shodo.StrokeEngine.prototype.getInterlatePos = function (p0, p1, moveLen) {
    /// <summary></summary>
    /// <param name="p0">a source position</param>
    /// <param name="p1">a destination position</param>
    /// <param name="moveLen"></param>
    /// <return>Object</return>
    var x = p0.x + (p1.x - p0.x)*moveLen;
    var y = p0.y + (p1.y - p0.y)*moveLen;

    return { x:x, y:y };
}

TheShodo.Shodo.StrokeEngine.prototype.getDistance = function (p0, p1) {
    /// <summary></summary>
    /// <param name="p0">a source position</param>
    /// <param name="p1">a destination position</param>
    /// <return>Number</return>
    var distance = ((p1.x - p0.x) * (p1.x - p0.x)) + ((p1.y - p0.y) * (p1.y - p0.y));
    return (distance == 0) ? distance : Math.sqrt(distance);
}

TheShodo.Shodo.StrokeEngine.prototype.getBufferedCurrentPosition = function () {
    /// <summary></summary>
    /// <return>Object</return>
    var pos = { x: 0, y: 0, t: 0, p: 0 };
    var bufferingSize = Math.min(this.bufferingSize, this.strokeBuffer.length);

    if (bufferingSize == 0) return null;

    for (var i = 1; i < bufferingSize+1; i++) {
        var p = this.strokeBuffer[this.strokeBuffer.length - i];
        pos.x += p.x;
        pos.y += p.y;
        pos.t += p.t;
        pos.p += p.p;
    }

    pos.x /= bufferingSize; 
    pos.y /= bufferingSize; 
    pos.t /= bufferingSize;
    pos.p /= bufferingSize;

    return pos;
}

TheShodo.Shodo.StrokeEngine.prototype.spline = function (x0, x1, v0, v1, t) {
    /// <summary>Spline function (A -> B -> C -> D)</summary>
    /// <param name="x0">point 1 (B)</param>
    /// <param name="x1">point 2 (C)</param>
    /// <param name="v0">velocity 1 (A -> C)</param>
    /// <param name="v1">velocity 2 (B -> D)</param>
    /// <param name="t"></param>
    /// <return>Number</return>
    return ((2*x0 - 2*x1 + v0 + v1) * Math.pow(t, 3)) + ((-3*x0 + 3*x1 - 2*v0 - v1) * Math.pow(t, 2)) + v0*t + x0;
}

//!!!!!!
TheShodo.Shodo.StrokeEngine.prototype.draw = function (isEnding) {
    /// <summary>Draw stroke line.</summary>
    var pos = this.getBufferedCurrentPosition();
    if (pos == null) return;
    //console.log(pos);

    if (this.previousPosition == null)
        this.previousPosition = pos;

    // ---- stroke setup
    var t = (pos.t - this.previousPosition.t);
    var distance = this.getDistance(pos, this.previousPosition);
    var velocity = distance / Math.max(1, t);
    var accelerate = (this.previousVelocity == 0) ? 0 : velocity / this.previousVelocity;
    //var brushSize = this.currentBrush.maxSize - Math.min(this.currentBrush.maxSize - this.currentBrush.minSize, Math.max(0, velocity * 12));
    var curve = function(t, b, c, d) {
        return c*t/d + b;
    }
    var brushSize = Math.max(this.currentBrush.minSize,
                             curve(velocity,
                                      this.currentBrush.maxSize,
                                      (-this.currentBrush.maxSize)-this.currentBrush.minSize,
                                      this.velocityPressureCoff
                                  )
                            );
    if (pos.p > 0) {
        // Has pressure value
        brushSize = Math.max(this.currentBrush.minSize, this.currentBrush.maxSize * pos.p);
    }

    function __(i) { return i.toString().replace(/(\.\d{4})\d+/, '$1'); }
    //console.log('v='+ __(velocity) + "; d=" + __(distance) + "; a=" + __(accelerate) + "; bsize=" + __(brushSize) + ' / (' + __(pos.x) + ',' + __(pos.y) + ') t:' + __(t));

    //
    pos.s = brushSize;

    // ---- draw
    var ctx = this.canvasContext;
    ctx.save();
    this.drawStroke(ctx, this.previousPosition, pos, brushSize, distance, velocity);
    //this.drawStrokeSpline(ctx, this.previousPosition, pos, brushSize, distance, velocity);
    ctx.restore();
    // ----

    this.accelerate = accelerate;
    this.expectedNextPosition = this.getInterlatePos(this.previousPosition, pos, 1+this.accelerate);
//    console.log('accelerate: '+this.accelerate);
//    console.log('pos: '+pos.x+','+pos.y);
//    console.log('expectedNextPosition: '+this.expectedNextPosition.x+','+this.expectedNextPosition.y);
    this.previousPosition = pos;
    this.previousBrushSize = brushSize;
    this.previousVelocity = velocity;
    this.previousDistance = distance;
}

TheShodo.Shodo.StrokeEngine.prototype.drawStroke = function (ctx, startPos, endPos, brushSize, distance) {
    var t = 0;
    var brushDelta = (brushSize - this.previousBrushSize);

    while (t < 1) {
        var brushSizeCur = Math.min(this.previousBrushSize + (brushDelta * t), this.currentBrush.maxSize);
        var pos = this.getInterlatePos(startPos, endPos, t);

        if (Math.random() > 0.2) {
            var jitter = ((Math.random() > 0.5) ? 1 : -1) * parseInt(Math.random() * 1.2, 10);
            var px = pos.x - brushSizeCur/2+jitter;
            var py = pos.y - brushSizeCur/2+jitter;
            ctx.drawImage(this.currentBrush.kasureImage, px, py, brushSizeCur, brushSizeCur);
            //console.log('drawImage: brushSize=%d, startPos.p=%d, endPos.p=%d, %d, %d, %d, %d', brushSize, startPos.p, endPos.p, px, py, brushSizeCur, brushSizeCur);
        }
        t += 1 / distance;
    }
}

TheShodo.Shodo.StrokeEngine.prototype.drawStrokeSpline = function (ctx, startPos, endPos, brushSize, distance, velocity) {
    /// <summary>Draw stroke line (Spline).</summary>
    this.splineBuffer.push(endPos);

    // Draw Stroke part (Spline)
    if (this.splineBuffer.length > 3) {
        var segCount = 40; // spline
        var buffLen = this.splineBuffer.length;
        var points = Array.apply(null, this.splineBuffer);
        points = points.slice(points.length-4);

        points.unshift(points[0]);
        points.push(points[points.length-1]);
        //console.log(points.map(function(e){ return e.x+"," +e.y;}).join('; '));

        for (var j = 0, m = points.length-3; j < m; j++) {
            var p0 = points[j];
            var p1 = points[j+1];
            var p2 = points[j+2];
            var p3 = points[j+3];
            var v0 = { x: (p2.x - p0.x) / 2, y: (p2.y - p0.y) / 2, s: (p2.s - p0.s) };
            var v1 = { x: (p3.x - p1.x) / 2, y: (p3.y - p1.y) / 2, s: (p3.s - p1.s) };

            var tmp1 = (2*p1.x - 2*p2.x + v0.x + v1.x);
            var tmp2 = (-3*p1.x + 3*p2.x - 2*v0.x - v1.x);
            var tmp3 = (2*p1.y - 2*p2.y + v0.y + v1.y);
            var tmp4 = (-3*p1.y + 3*p2.y - 2*v0.y - v1.y);

            for (var i = 1, n = segCount+1; i <= n; i++) {
                var seg = i/segCount;
                
                // Method Inlining --
                // function spline() {
                //     return ((2*x0 - 2*x1 + v0 + v1) * Math.pow(t, 3)) + ((-3*x0 + 3*x1 - 2*v0 - v1) * Math.pow(t, 2)) + v0*t + x0;
                // }
                // var tX = this.spline(p1.x, p2.x, v0.x, v1.x, seg);
                // var tY = this.spline(p1.y, p2.y, v0.y, v1.y, seg);
                var tX = (tmp1 * Math.pow(seg, 3)) + (tmp2 * Math.pow(seg, 2)) + v0.x*seg + p1.x;
                var tY = (tmp3 * Math.pow(seg, 3)) + (tmp4 * Math.pow(seg, 2)) + v0.y*seg + p1.y;
 
                //var tS = this.spline(p1.s, p2.s, v0.s, v1.s, seg);
                var tS = this.previousBrushSize + ((brushSize - this.previousBrushSize) / segCount)*i;
            
                if (this.previousBrushSize == brushSize && Math.random() < 0.3)
                    continue;

                ctx.drawImage(this.currentBrush.image,
                      tX - (tS/2),
                      tY - (tS/2),
                      tS,
                      tS);

    //            if (Math.random() > 0.6) {
    //                ctx.drawImage(this.currentBrush.image,
    //                      tX + (Math.random() * 0) - (brushSize/2),
    //                      tY + (Math.random() * 0) - (brushSize/2),
    //                      brushSize,
    //                      brushSize);
    //            }
            }
        }
    }
}

// Setup ----------------------------------------------------------------------

TheShodo.Shodo.Shared = { StrokeEngine: null, StrokeManager: null };
