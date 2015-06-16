/// <reference path="../TheShodo.js" />
/// <reference path="../TheShodo.Shodo.Core.js" />
/// <reference path="../TheShodo.Shodo.Resources.js" />
/// <reference path="kazari.js" />

TheShodo.Shodo.Write = {
    // -- Settings
    videoFadeOutDuration  : 600,
    videoFadeOutTiming    : 15.5,
    alwaysSkipIntro       : false,
    isUAInlineSVGSupported: false,
    preloadImages         : [
        '/shared/img/write/icon_checkbox_01.png',
        '/shared/img/write/icon_checkbox_01_o.png',
        '/shared/img/write/icon_checkbox_02.png',
        '/shared/img/write/icon_checkbox_02_o.png',
    ].map(function (e) { return TheShodo.sharedBaseUrl + e; }),

    currentPaper: 'hanshi',
    pageMode    : '',
    pageScale   : 1,
    
    // -- Variables
    CurrentPlayer: null
};

//
// -- EntryPoint --------------------------------------------------------------
//
$(document).ready(function () {
    if (!TheShodo.UA.isCanvasSupported) {
        $('.block-notice-dummy-canvas').css('display', 'block');
        return;
    }
    
    TheShodo.Shodo.Write.launch();
});

//
// -- Setup -------------------------------------------------------------------
//
// Setup flow: prepareStage -> launch -> loading(waiting for all resources) -> intro -> initialize -> stand by ready! 
//
TheShodo.Shodo.Write.launch = function () {
    this.commandHooker = new Kazari.CommandHooker();
    this.commandHooker.setup(window);
    this.commandHooker.addMapping(['s'], function () { $('#write-tools-movie').prop('currentTime', TheShodo.Shodo.Write.videoFadeOutTiming); });

    this.prepareStage();


    $('.write-stage').show();

    this.showLoading();

    this.skipIntro = TheShodo.Shodo.Write.alwaysSkipIntro ||
                     Kazari.SessionStorage.getItem('TheShodo.Shodo.Write.skipIntro', false) ||
                     Kazari.LocalStorage.getItem('TheShodo.Shodo.Write.skipIntro', false);
}


TheShodo.Shodo.Write.prepareStage = function (ratio, mode) {
    var ratio, mode;
    if (window.innerHeight >= 896) {
        // SXGA
        ratio = 1.308;
        mode = 'sxga';
    } else if (window.innerHeight >= 681) {
        // WXGA
        ratio = 1.08;
        mode = 'wxga';
    } else {
        // Default
        TheShodo.Shodo.Write.preloadImages.push(TheShodo.sharedBaseUrl + '/shared/img/write/frame.png');
        return;
    }

    TheShodo.Shodo.Write.preloadImages.push(TheShodo.sharedBaseUrl + '/shared/img/write/' + mode + '/frame.png');
    $('body').addClass('screen-mode-' + mode);
    $('#layered-canvas, #write-canvas, #hand-canvas').each(function (i, e) {
        e.width *= ratio;
        e.height *= ratio;
    });
    $('#hanshi-image, #write-bunchin, #write-shitajiki').each(function (i, e) {
        var node = $(e);
        node.attr('src', node.attr('src').replace(/(.*\/)/, "$1" + mode + "/"));
    });

    TheShodo.Shodo.Write.pageMode = mode || '';
    TheShodo.Shodo.Write.pageScale = mode || 1.0;
    //TheShodo.Shodo.Shared.StrokeEngine.width = $('#write-canvas').prop('width');
    //TheShodo.Shodo.Shared.StrokeEngine.height = $('#write-canvas').prop('height');
}

TheShodo.Shodo.Write.showLoading = function () {
    // Loading...
    TheShodo.Shodo.Write.LoadingPanel.show();
//    var loadingPanel = new TheShodo.FloatingPanel('Loading',
//                                                  '<div>Loading Resources... (<span class="loadedCount">0</span> / <span class="totalCount">0</span>)</div>',
//                                                  { hasClose: false });

    var loadingWatcher = new Kazari.ResourceLoadingWatcher();
    loadingWatcher
        .register($('.write-container img').get().filter(function (e) { return e.tagName != 'image'; })) // filter [SVGImageElement]
        .register($('#top-menu img').get().filter(function (e) { return e.tagName != 'image'; })) // filter [SVGImageElement]
        .register(document.getElementById('write-tools-movie'))
        .register(this.preloadImages.map(function (e) { var img = document.createElement('img'); img.src = e; return img; }))
        .onProgress(function (loadedCount, totalCount) {
            if (window.console && window.console.log) {
                console.log('Resources: '+ loadedCount + '/' + totalCount + '; ' + loadingWatcher.watchTargets.map(function (e) { return (e.src || e.href || e.data || '<'+e.tagName+'>').toString().replace(/.*\//, ''); }).join(', '));
            }
        })
        .onComplete($.proxy(function () {
            TheShodo.Shodo.Write.LoadingPanel.close();
            TheShodo.Shodo.Write.onLoadingComplete();
        }, this))
        .start();
    ;
}

TheShodo.Shodo.Write.onLoadingComplete = function () {
    $('#write-shitajiki').fadeIn('fast', function () {
        $('#write-hanshi').fadeIn('slow', function () {
            $('#write-bunchin').fadeIn('slow', function () {
                if (TheShodo.Shodo.Write.skipIntro) {
                    // skip intro
                    TheShodo.Shodo.Write.initialize();
                } else {
                    // at first time (with introduction movie)
                    TheShodo.Shodo.Write.playIntro();
                }
            })
        })
    });
}

TheShodo.Shodo.Write.playIntro = function () {
    var blocker = function (e) {
        e.preventDefault(); e.stopPropagation();
        $('.playing-movie-notice').hide().remove();

        var offset = $(this).offset();
        var x = e.pageX - offset.left;
        var y = e.pageY - offset.top;

        $('<span class="playing-movie-notice" />')
            .html('<span>Preparing ink.</span><br /><span>Please wait a moment.</span>')
            .css('left', (x - 162/2) + 'px')
            .css('top', (y - 56) +'px')
            .appendTo($('.content'))
            .fadeIn()
            .delay(1000)
            .fadeOut()
        ;
    }

    $('body .content').click(blocker);
    
    var videoE = $('#write-tools-movie')
        //.bind('ended', function(e) { $('#write-tools').fadeIn(); })
        .fadeIn()
        .bind('timeupdate', function(e) {
            if ($(this).prop('currentTime') > TheShodo.Shodo.Write.videoFadeOutTiming) {
                $(this).unbind('timeupdate', arguments.callee);
                
                $('body .content').unbind('click', blocker);

                // skip intro at next time
                Kazari.SessionStorage.setItem('TheShodo.Shodo.Write.skipIntro', true);
                // prepare
                TheShodo.Shodo.Write.initialize();
            }
        })
        .get(0)
    ;
    videoE.volume = 0;
    videoE.play();
}

TheShodo.Shodo.Write.initialize = function () {
    // Check Inline SVG
    if (TheShodo.UA.isSVGSupported) {
        if ($('svg').get(0).namespaceURI == 'http://www.w3.org/2000/svg') {
            this.isUAInlineSVGSupported = true;
        }
    }

    // show all elements & setup
    $('#write-tools-movie').fadeOut(this.videoFadeOutDuration, $.proxy(function () {
        // prepare
        if (this.isUAInlineSVGSupported) {
            this.prepareCopybookSelection();
        }

        this.attachButtonEvents();
        this.setupKeyEvents();//!!!
        this.initializeStrokeEngine();//!!!
    },this));


    // show tools
    if (this.isUAInlineSVGSupported) {
        $('#top-menu .menu-copybook').css('display', 'inline-block');
    }
    $('#top-menu').animate({ top: '0px' }, 'fast');
    $('#write-fude-medium').css('visibility', 'hidden');
    $('#write-tools-ink').fadeIn('fast');
    $('#logo-layer').fadeIn('fast');
    $('#write-tools-stage').fadeIn('fast', function () { $('body').addClass('write-ready'); });

    // Set Rollover
    $('.content a')
        .hover(function (e) {
            // in
            $(this).find('img.rollover').each(function (i, e) {
                e.src = e.src.replace(/(\.\w+)$/, '_o$1');
            });
        }, function (e) {
            // out
            $(this).find('img.rollover').each(function (i, e) {
                e.src = e.src.replace(/_o(\.\w+)$/, '$1');
            });
        });
}

TheShodo.Shodo.Write.prepareCopybookSelection = function () {
    // copybook
    var freeSelect = $('#copybook-select li:last-child');
    var copybookOrig = document.getElementById('copybook');
    var chars = copybookOrig.getElementsByTagName('g');
    for (var i = 0, n = chars.length; i < n; i++) {
        var gCloned = chars[i].cloneNode(true);
        var svgImage = copybookOrig.cloneNode(false);
        svgImage.appendChild(gCloned);
        svgImage.setAttribute('height', '32px');
        svgImage.setAttribute('width', '32px');
        gCloned.style.display = 'block';

        var title = gCloned.getAttributeNS('http://www.w3.org/1999/xlink', 'title');
        
        var image = gCloned.getElementsByTagName('image')[0];
        var imageSrc;
        if (image) {
            imageSrc = image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        }

        $('<li><a class="" href="#"><span class="label"><img src="" alt="" /></span></a></li>')
            .find('a')
                .addClass(gCloned.id)
                .prepend(svgImage)
                .end()
            .find('.label img')
                .attr('src', imageSrc)
                .attr('alt', title)
                .end()
            .insertBefore(freeSelect)
        ;
    }
}

//!!!!!!
TheShodo.Shodo.Write.initializeStrokeEngine = function () {debugger
    // setup/start StrokeManager/Engine
    var canvas = $('#write-canvas');
    var canvasE = canvas.get(0);
    var layeredCanvas = $('#layered-canvas');
    var layeredCanvasE = layeredCanvas.get(0);
    var handCanvas = $('#hand-canvas');

    // hand visiblity
    var isHandVisible = Kazari.LocalStorage.getItem('TheShodo.Shodo.Write.isHandVisible', true);
    $('#hand-visibility-checkbox').show().toggleClass('checked', isHandVisible);

    TheShodo.Shodo.Shared.StrokeEngine = new TheShodo.Shodo.StrokeEngine(canvasE.width, canvasE.height, canvas, layeredCanvasE);
    TheShodo.Shodo.Shared.StrokeEngine.onImageCreated = TheShodo.Shodo.Write.onImageCreated;
    TheShodo.Shodo.Shared.StrokeManager = new TheShodo.Shodo.StrokeManager(handCanvas, TheShodo.Shodo.Shared.StrokeEngine);
    TheShodo.Shodo.Shared.StrokeManager.isHandVisible = isHandVisible;
    TheShodo.Shodo.Shared.StrokeManager.start();
}


//
// -- Configuration Methods ---------------------------------------------------
//
TheShodo.Shodo.Write.selectBrush = function (brushName) {
    /// <summary>Select a brush</summary>
    TheShodo.Shodo.Shared.StrokeManager.selectBrush(brushName);

    $('#write-tools-stage *').css('visibility', 'visible').animate({ opacity: 1 });
    $('#write-fude-' + brushName.toLowerCase()).css('visibility', 'hidden').animate({ opacity: 0 });
    $('#hand-image img').hide();
    $('#hand-image-' + brushName.toLowerCase()).show();
}

TheShodo.Shodo.Write.setBrushOpacity = function (opacity) {
    /// <summary>Set brush opacity</summary>
    TheShodo.Shodo.Shared.StrokeManager.setBrushOpacity(opacity);
}

TheShodo.Shodo.Write.setBrushColor = function (color) {
    /// <summary>Set brush color</summary>
    TheShodo.Shodo.Shared.StrokeManager.setBrushColor(color);

    // handImage Color
    var color = TheShodo.Shodo.Shared.StrokeManager.getBrushColor();
    $('#hand-image img').each(function (i, e) {
        var handImage = $(e);
        handImage.prop('src', handImage.prop('src').replace(/hand_([LMS]).*?\.png$/, 'hand_$1' + (
              (color == 0xE3632C) ? '_red'
            : (color == 0x56BC53) ? '_green'
            : (color == 0x597AB6) ? '_blue'
            : (color == 0xB6B615) ? '_yellow'
                                  : ''
        ) + '.png')); // color
    });
}

TheShodo.Shodo.Write.clear = function () {
    /// <summary>Show 'Clear' confirmation dialog</summary>
    var floatingPanel = new TheShodo.FloatingPanel.MessageBox('',
                                                              TheShodo.Shodo.Resources.Write.String.Panel_Clear_Label || 'Clear?',
                                                              [
                                                                  { label: TheShodo.Shodo.Resources.Write.String.Panel_Cancel || 'Cancel', isCancel: true, isDefault: true },
                                                                  { label: TheShodo.Shodo.Resources.Write.String.Panel_Delete || 'Yes',
                                                                    onClick: function (sender, e) {
                                                                          TheShodo.Shodo.Write.onClear(sender);
                                                                          sender.close();
                                                                    }
                                                                  },
                                                              ]);
    floatingPanel.show();
}

TheShodo.Shodo.Write.selectPaper = function (paperName) {
    /// <summary>Set Paper</summary>

    // select paper
    var paperNameWithMode = ((TheShodo.Shodo.Write.pageMode == '') ? '' : TheShodo.Shodo.Write.pageMode + '/') + paperName;

    TheShodo.Shodo.Write.currentPaper = paperName;
    $('#hanshi-image').attr('src', 'shared/img/write/' + paperNameWithMode + '.png');
}

TheShodo.Shodo.Write.selectLogo = function (logoName) {
    /// <summary>Set Logo</summary>

    // select logo
    if (logoName) {
        $('#logo-image').fadeIn('fast').attr('src', 'shared/img/write/' + logoName + '.png');
    } else {
        $('#logo-image').fadeOut('fast');
    }
}

//
// -- Utility ------------------------------------------------------------------
//

TheShodo.Shodo.Write.addJumpList = function (title, url, createdAt) {
    if (TheShodo.UA.isSiteMode) {
        var recentMyWorks = Kazari.LocalStorage.getItem("TheShodo.Shodo.Write.recentMyWorks", []);
        recentMyWorks.unshift({ title: title, url: url, createdAt: createdAt.getTime() });
        if (recentMyWorks.length > 20) {
            recentMyWorks.pop();
        }
        Kazari.LocalStorage.setItem("TheShodo.Shodo.Write.recentMyWorks", recentMyWorks);

        // build jumplist
        window.external.msSiteModeCreateJumplist(TheShodo.Shodo.Resources.Write.String.Jumplist_Label_RecentMyWorks || "Recent My Works");
        recentMyWorks.forEach(function (e, i) {
            var label = e.title.replace(/\r|\n/g, "");
            var createdAt = new Date(e.createdAt);
            if (label.length > 15) {
                label = label.slice(0, 15) + "...";
            }
            label += " (" + (createdAt.getYear()+1900) + "/" + (createdAt.getMonth() + 1) + "/" + createdAt.getDate() + " " + (createdAt.getHours() < 10 ? "0" : "") + createdAt.getHours() + ":" + (createdAt.getMinutes() < 10 ? "0" : "") + createdAt.getMinutes() + ")";
            window.external.msSiteModeAddJumpListItem(label, e.url, "/favicon.ico");
        });
        window.external.msSiteModeShowJumplist();
    }
}

//
// -- Events ------------------------------------------------------------------
//
//!!!!!!
TheShodo.Shodo.Write.setupKeyEvents = function () {debugger
    function isFloatingPanelOpened() { return TheShodo.FloatingPanel.Shared.currentPanelStack.length != 0; }

    this.commandHooker.clearMappings();
    this.commandHooker.addMapping(
        ['b'],
        function () {
            if (isFloatingPanelOpened()) return;

            switch (TheShodo.Shodo.Shared.StrokeEngine.currentBrush.name) {
                case 'Small':
                    TheShodo.Shodo.Write.selectBrush('Medium'); break;
                case 'Medium':
                    TheShodo.Shodo.Write.selectBrush('Large'); break;
                case 'Large':
                    TheShodo.Shodo.Write.selectBrush('Small'); break;
                default:
                    TheShodo.Shodo.Write.selectBrush('Medium'); break;
            }
        }
    );
    this.commandHooker.addMapping(['del'], function () { if (!isFloatingPanelOpened()) TheShodo.Shodo.Write.clear(); });
    this.commandHooker.addMapping(['d'], function () { if (!isFloatingPanelOpened()) TheShodo.Shodo.Write.clear(); });
    this.commandHooker.addMapping(['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'], function () { window.location = 'http://www.b-architects.com/'; });
}

// Attach tools button events
TheShodo.Shodo.Write.attachButtonEvents = function () {
    // fude
    $('#write-tools-stage').click(TheShodo.Shodo.Write.onStageClicked);
    // ink
    $('#write-tools-ink').click(TheShodo.Shodo.Write.onInkClicked);

    // [Clear]
    $('#button-clear').click(TheShodo.Shodo.Write.onClearButtonClicked);
    // [Finish]
    $('#button-finish').click(TheShodo.Shodo.Write.onFinishButtonClicked);

    // [Copybook]
    $('#copybook-select a').click(TheShodo.Shodo.Write.onCopybookItemClicked);

    // [Paper/Logo]
    $('#paper-select a').click(TheShodo.Shodo.Write.onSelectPaperClicked);
    $('#logo-select a').click(TheShodo.Shodo.Write.onSelectLogoClicked);

    // Menus
    $('.close-menu').click(TheShodo.Shodo.Write.onMenuCloseClicked);
    $('.menu-folding > a:first-child').click(TheShodo.Shodo.Write.onMenuButtonClicked);

    // "show hand holding brush"
    $('#hand-visibility-checkbox').click(TheShodo.Shodo.Write.onHandCheckboxClicked);
}

// On "show hand holding brush" Clicked
TheShodo.Shodo.Write.onHandCheckboxClicked = function (e) {
    e.preventDefault();
    var isVisible = $(this).toggleClass('checked').hasClass('checked');
    TheShodo.Shodo.Shared.StrokeManager.isHandVisible = isVisible;
    Kazari.LocalStorage.setItem('TheShodo.Shodo.Write.isHandVisible', isVisible);
}

// On [Save to Gallery] Clicked
TheShodo.Shodo.Write.onSave = function (sender, e) {
    // to JSON
    var formE = $('form').get(0);
    var sendData = TheShodo.createDataFromForm(formE);
    sendData.Data = TheShodo.Shodo.Shared.StrokeManager.toDataURL('image/png');
    sendData.StrokeHistory = {
          Version:    2
        , Strokes:    JSON.stringify(TheShodo.Shodo.Shared.StrokeManager.strokeHistory)
        , Width:      TheShodo.Shodo.Shared.StrokeEngine.width
        , Height:     TheShodo.Shodo.Shared.StrokeEngine.height
        , Background: TheShodo.Shodo.Write.currentPaper
    };

    //if (window.console && window.console.log) console.log(JSON.stringify(data));

    $.ajax({
        type: 'POST',
        url: formE.action,
        data: JSON.stringify(sendData),
        beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-RequestVerificationToken', formE['__RequestVerificationToken'].value);
                    },
        success: function (data, textStatus, xhr) {
                    if (data && data.IsCommitted) {
                        TheShodo.Shodo.Write.LoadingPanel.close();
                        // add JumpList
                        TheShodo.Shodo.Write.addJumpList(sendData.Comment, data.Url, new Date());
                        // show Entry Page
                        var panel = new TheShodo.Shodo.Write.EntryPanel(data.Url, '/Gallery');
                        panel.show();
                    } else if (data && data.ErrorMessage) {
                        TheShodo.Shodo.Write.ErrorMessageBox.show(TheShodo.Shodo.Resources.Write.String.SendErrorOnDone, "Error: "+data.ErrorMessage);
                        TheShodo.Shodo.Write.LoadingPanel.close();
                    } else {
                        TheShodo.Shodo.Write.ErrorMessageBox.show(TheShodo.Shodo.Resources.Write.String.SendErrorOnDone, "Error: Unknown");
                        TheShodo.Shodo.Write.LoadingPanel.close();
                    }
                },
        error: function (xhr, textStatus, error) {
            TheShodo.Shodo.Write.ErrorMessageBox.show(TheShodo.Shodo.Resources.Write.String.SendErrorOnDone, "Error: "+error);
            TheShodo.Shodo.Write.LoadingPanel.close();
        },
        contentType: 'application/json',
        dataType: 'json'
    });

    TheShodo.Shodo.Write.LoadingPanel.show();
}

// On Ink Clicked
TheShodo.Shodo.Write.onInkClicked = function (e) {
    e.preventDefault();
    var panel = new TheShodo.Shodo.Write.PanelSelectInk();
    panel.onInkSelected = function (selectedOpacity, selectedColor) {
        TheShodo.Shodo.Write.setBrushColor(selectedColor);
        TheShodo.Shodo.Write.setBrushOpacity(selectedOpacity);
    };
    panel.show(TheShodo.Shodo.Shared.StrokeManager.getBrushOpacity(), TheShodo.Shodo.Shared.StrokeManager.getBrushColor());
}

// On Tools(Fude) Clicked
TheShodo.Shodo.Write.onStageClicked = function (e) {
    e.preventDefault();
    var panel = new TheShodo.Shodo.Write.PanelSelectBrush();
    panel.onBrushSelected = function (brushName) {
        TheShodo.Shodo.Write.selectBrush(brushName);
    };
    panel.show(TheShodo.Shodo.Shared.StrokeEngine.currentBrush.name);
}

// On "Select Paper" Clicked
TheShodo.Shodo.Write.onSelectPaperClicked = function (e) {
    e.preventDefault();

    TheShodo.Shodo.Write.selectPaper($(this).data('paper-name'));

    // mark
    $(this)
        .parents('menu').first()
            .find('li')
                .removeClass('selected')
                .end()
            .end().end()
        .parent()
            .addClass('selected')
    ;
}

// On "Select Logo" Clicked
TheShodo.Shodo.Write.onSelectLogoClicked = function (e) {
    e.preventDefault();

    TheShodo.Shodo.Write.selectLogo($(this).data('logo-name'));

    // mark
    $(this)
        .parents('menu').first()
            .find('li')
                .removeClass('selected')
                .end()
            .end().end()
        .parent()
            .addClass('selected')
    ;
}

// On [Finish] (top-menu) Clicked
TheShodo.Shodo.Write.onFinishButtonClicked = function (e) {
    e.preventDefault();
    
    // create clipped background-image
    var currentBackgroundImage = document.getElementById('hanshi-image');
    var tmpBackground = document.createElement('canvas');
    tmpBackground.height = TheShodo.Shodo.Shared.StrokeEngine.height;
    tmpBackground.width = TheShodo.Shodo.Shared.StrokeEngine.width;
    var ctx = tmpBackground.getContext('2d');
    var top = currentBackgroundImage.height - tmpBackground.height;
    ctx.drawImage(currentBackgroundImage, 0, -top, tmpBackground.width, tmpBackground.height+top);

    TheShodo.Shodo.Shared.StrokeEngine.backgroundImage = tmpBackground;

    var panel = new TheShodo.Shodo.Write.PanelFinish();
    panel.onSave = TheShodo.Shodo.Write.onSave;
    panel.show(TheShodo.Shodo.Shared.StrokeManager.toDataURL());
}

// On [Clear] (top-menu) clicked.
TheShodo.Shodo.Write.onClearButtonClicked = function (e) {
    e.preventDefault();
    TheShodo.Shodo.Write.clear();
}

// On Click Clear in floating panel.
TheShodo.Shodo.Write.onClear = function (e) {
    TheShodo.Shodo.Shared.StrokeManager.lock();

    var hanshiE = document.getElementById('write-hanshi');
    var bunchinE = document.getElementById('write-bunchin');
    var layeredE = document.getElementById('layered-canvas');

    var maxSize = 1;
    var initSize = 1;
    var duration = 300;

    var canvas = layeredE;
    var ctx = canvas.getContext('2d');

    // "syuwa-syuwa-" effect animation
    var currentImage = TheShodo.Shodo.Shared.StrokeEngine.getImage(true);
    Kazari.Animation.initialize()
        .addScene(function (state) {
            var easing = Kazari.JSTweener.easingFunctions.easeOutQuad;
            if (state.elapsed > duration) {
                state.onNext();
                return;
            }

            ctx.save();
            ctx.globalAlpha = 0.1;
            var value = (state.elapsed >= duration) ? maxSize : easing(state.elapsed, 0, maxSize, duration);
//            ctx.drawImage(currentImage,
//                          0, 0, canvas.width, canvas.height, /* src */
//                          0-value/2, 0-value/2, canvas.width + value, canvas.height + value /* dst */);

            [0, -value, value].forEach(function (left) {
                [0, -value, value].forEach(function (top) {
                    ctx.drawImage(currentImage,
                                  0, 0, canvas.width, canvas.height, /* src */
                                  top, left, canvas.width, canvas.height /* dst */);
                });
            });

            ctx.restore();
 
            // Opacity: 1 -> 0
            var opacity = (state.elapsed >= duration) ? 0 : easing(state.elapsed, 1, 0 - 1, duration);
            canvas.style.opacity = opacity;
        })
        .addScene(function (state) {
            TheShodo.Shodo.Shared.StrokeManager.unlock();
            TheShodo.Shodo.Shared.StrokeManager.clearHistory();
            canvas.style.opacity = 1;
            state.onNext();
        })
    ;
}

// On [Copybook]or[Paper/Logo] Clicked
TheShodo.Shodo.Write.onMenuButtonClicked = function (e) {
    e.preventDefault();
    var container = $(this).parent();

    var isOpened = container.hasClass('menu-opened');

    if (!isOpened) {
        // open
        $('#top-menu .menu-opened').removeClass('menu-opened').find('.submenu').hide();
    }

    container
        .toggleClass('menu-opened', !isOpened)
        .find('.submenu').fadeTo('fast', (isOpened ? 0 : 1), function () { $(this).toggle((isOpened ? false : true)); });

}

// On [Copybook]or[Paper/Logo] -> [x Close] Clicked
TheShodo.Shodo.Write.onMenuCloseClicked = function (e) {
    e.preventDefault();
    // close
    $(this)
        .parents('.menu-folding')
            .find('.submenu')
                .fadeOut('fast', function () { $(this).parent().removeClass('menu-opened'); })
                .end()
    ;
}

// On Copybook Selection Item selected
TheShodo.Shodo.Write.onCopybookItemClicked = function (e) {
    e.preventDefault();

    // select copybook
    $('#copybook-layer')
        .attr('class', $(this).attr('class'))
        .find('svg g')
            //.fadeOut()
            .hide()
            .end()
        .find('#' + $(this).attr('class'))
            .show()
            .css('opacity', 0)
            .animate({ opacity: 1 })
            //.fadeIn()
            .end();

    // mark
    $(this)
        .parents('menu').first()
            .find('li')
                .removeClass('selected')
                .end()
            .end().end()
        .parent()
            .addClass('selected')
    ;
}

TheShodo.Shodo.Write.onImageCreated = function (canvas) {
    // draw logo
    var ctx = canvas.getContext('2d');
    var logoImage = $('#logo-image:visible')[0];
    if (logoImage) {
        ctx.drawImage(logoImage,
                     (canvas.width - logoImage.width) - 15,
                     (canvas.height - logoImage.height) - 10,
                     logoImage.width, logoImage.height);
    }
}