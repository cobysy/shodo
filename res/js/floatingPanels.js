/// <reference path="../jquery-1.4.2-vsdoc.js" />
/// <reference path="../TheShodo.js" />
/// <reference path="../TheShodo.Shodo.Core.js" />
/// <reference path="../TheShodo.Shodo.Resources.js" />
/// <reference path="writeBootstrap.js" />

"use strict";
//
// -- Brush Select Panel ------------------------------------------------------
//
TheShodo.Shodo.Write.PanelSelectBrush = function (selectedBrush) {
    this.className = 'panel-select-brush';
    this.selectorOrContent = $('#floating-panel-content-select-brush').html();
    this.selectedBrush = selectedBrush || 'Medium';
    this.buttons = [
        {
            label: TheShodo.Shodo.Resources.Write.String.Panel_OK || 'OK',
            onClick: function (sender, e) {
                sender.onBrushSelected(sender.selectedBrush);
                sender.close();
            }
        }
    ];
    this.hasButtons = true;
}
TheShodo.Shodo.Write.PanelSelectBrush.prototype = new TheShodo.FloatingPanel(TheShodo.Shodo.Resources.Write.String.Panel_SelectBrush_Title || "Brush Selection");
TheShodo.Shodo.Write.PanelSelectBrush.prototype.onBeforePanelShow = function (selectedBrush) {
    var self = this;
    this.selectedBrush = selectedBrush;
    this.content
        // bind events
        .find('li a')
            .click(function (e) {
                e.preventDefault();
                self.content.find('li').removeClass('selected');
                $(this).parent().addClass('selected');

                self.selectedBrush = $('img', $(this)).attr('alt');
            })
            .end()

        // clear all selection
        .find('li.brush-' + (selectedBrush || this.selectedBrush).toLowerCase())
            .addClass('selected')
            .end()
        ;
}
TheShodo.Shodo.Write.PanelSelectBrush.prototype.onBrushSelected = function (brushName) { throw "NotImplemented"; }

//
// -- Ink Select Panel ------------------------------------------------------
//
TheShodo.Shodo.Write.PanelSelectInk = function (selectedOpacity, selectedColor) {
    this.className = 'panel-select-ink';
    this.selectorOrContent = $('#floating-panel-content-select-ink').html();
    this.selectedOpacity = selectedOpacity || 1.0;
    this.selectedColor = selectedColor || 0x00;
    this.buttons = [
        {
            label: TheShodo.Shodo.Resources.Write.String.Panel_OK || 'OK',
            onClick: function (sender, e) {
                sender.onInkSelected(sender.selectedOpacity, sender.selectedColor);
                sender.close();
            }
        }
    ];
    this.hasButtons = true;
}
TheShodo.Shodo.Write.PanelSelectInk.prototype = new TheShodo.FloatingPanel(TheShodo.Shodo.Resources.Write.String.Panel_SelectInk_Title || "Ink Selection");
TheShodo.Shodo.Write.PanelSelectInk.prototype.onBeforePanelShow = function (selectedOpacity, selectedColor) {
    var self = this;
    this.selectedOpacity = selectedOpacity;
    this.selectedColor = selectedColor;
    this.content
    // bind events
        .find('.select-opacity li a')
            .click(function (e) {
                e.preventDefault();
                $(this).parent().siblings().removeClass('selected');
                $(this).parent().addClass('selected');

                self.selectedOpacity = parseInt($('img', $(this)).attr('alt').replace(/%/, ''), 10)/100;
            })
            .end()
        .find('.select-color li a')
            .click(function (e) {
                e.preventDefault();
                $(this).parent().siblings().removeClass('selected');
                $(this).parent().addClass('selected');

                self.selectedColor = parseInt($(this).parent().attr('data-color'), 16);
            })
            .end()

        // clear all selection
        .find('li.opacity-' + ((selectedOpacity || this.selectedOpacity) * 100))
            .addClass('selected')
            .end()
        .find('li.color-' + (function(v){var s = v.toString(16); return new Array(7 - s.length).join('0') + s;})(selectedColor || this.selectedColor))
            .addClass('selected')
            .end()
        ;
}
TheShodo.Shodo.Write.PanelSelectInk.prototype.onInkSelected = function (opacity, texture) { throw "NotImplemented"; }

//
// -- Paper Select Panel ------------------------------------------------------
//
TheShodo.Shodo.Write.PanelSelectPaper = function (selectedPaper) {
    this.className = 'panel-select-paper';
    this.selectorOrContent = $('#floating-panel-content-select-paper').html();
    this.selectedPaper = selectedPaper || '1';
    this.buttons = [
        {
            label: TheShodo.Shodo.Resources.Write.String.Panel_OK || 'OK',
            onClick: function (sender, e) {
                sender.onPaperSelected(sender.selectedPaper);
                sender.close();
            }
        }
    ];
    this.hasButtons = true;
}
TheShodo.Shodo.Write.PanelSelectPaper.prototype = new TheShodo.FloatingPanel(TheShodo.Shodo.Resources.Write.String.Panel_SelectPaper_Title || "Paper Selection");
TheShodo.Shodo.Write.PanelSelectPaper.prototype.onBeforePanelShow = function (selectedPaper) {
    var self = this;
    this.selectedPaper = selectedPaper;
    this.content
    // bind events
        .find('li a')
            .click(function (e) {
                e.preventDefault();
                self.content.find('li').removeClass('selected');
                $(this).parent().addClass('selected');

                self.selectedPaper = $(this).parent().data('paper-name');
            })
            .end()

    // clear all selection
        .find('li.paper-' + (selectedPaper || this.selectedPaper).toLowerCase())
            .addClass('selected')
            .end()
        ;
}
TheShodo.Shodo.Write.PanelSelectPaper.prototype.onPaperSelected = function (paperName) { throw "NotImplemented"; }

//
// -- Finish Panel ------------------------------------------------------
//
TheShodo.Shodo.Write.PanelFinish = function () {
    this.className = 'panel-finish';
    this.selectorOrContent = $('#floating-panel-content-finish').html();
    this.buttons = [
        {
            label: TheShodo.Shodo.Resources.Write.String.Panel_Cancel || 'Cancel',
            isCancel: true,
            onClick: function (sender, e) {
                sender.close();
            }
        },
        {
            label: TheShodo.Shodo.Resources.Write.String.Panel_Finish_SaveToGallery || 'Save to Gallery',
            className: 'button save-button',
            isSubmit: true,
            onClick: function (sender, e) {
                if (!sender.hasError()) {
                    sender.onSave(sender, e);
                }
                return false;
            }
        }
    ];
    this.comment = '';
    this.hasButtons = true;
    this.cancelOnEscKey = false;
}
TheShodo.Shodo.Write.PanelFinish.prototype = new TheShodo.FloatingPanel(TheShodo.Shodo.Resources.Write.String.Panel_Finish_Title || "Save your work");
TheShodo.Shodo.Write.PanelFinish.prototype.updateTenkoku = function (tenkoku) {
    Kazari.LocalStorage.setItem('TheShodo.Shodo.Write.tenkokuName', tenkoku);

    var tenkokuSpan = this.content.find('span.tenkoku');
    tenkokuSpan
        .toggle(
                (TheShodo.Shodo.Write.CurrentPlayer == null || TheShodo.Shodo.Write.CurrentPlayer.state == TheShodo.Shodo.Player.PlayState.Stopped) &&
                (tenkoku != null && tenkoku.length != 0)
               )
        .html('');
    tenkoku.split('').forEach(function (e) { tenkokuSpan.append($('<span></span>').text(e).append('<br />')); });
}

TheShodo.Shodo.Write.PanelFinish.prototype.getTenkoku = function () {
    return this.content.find('.tenkoku-input:input').val() || "";
}

TheShodo.Shodo.Write.PanelFinish.prototype.validate = function () {
    var hasError = (this.comment.length > 100);
    this.content
        .find('.comment-characters-limit')
            .text(100 - this.comment.length)
            .toggleClass('has-error', hasError)
            .end()
        .find('[name=Comment]')
            .toggleClass('has-error', hasError)
            .end()
    ;

    if (hasError) {
        this.buttonsContainer.find('.save-button').attr('disabled', 'disabled');
    } else {
        this.buttonsContainer.find('.save-button').removeAttr('disabled');
    }
}

TheShodo.Shodo.Write.PanelFinish.prototype.hasError = function () {
    return (this.content.find('.has-error').length != 0);
}

TheShodo.Shodo.Write.PanelFinish.prototype.onBeforePanelShow = function (imageDataUrl) {
    if (imageDataUrl == null || imageDataUrl == '') throw "imageDataUrl can not be blank.";

    var defaultName = Kazari.LocalStorage.getItem('TheShodo.Shodo.Write.tenkokuName', '');
    var normalizeTenkoku = function (e) {
        var value = e.target.value;
        var newValue = value.replace(/[^a-zA-Z0-9\-]/g, '').replace(/(^\s+|\s+$)/g, '');
        if (value != newValue) {
            e.target.value = newValue;
        }
    }

    this.content
        .find('form')
            .submit($.proxy(function (e) {
                e.preventDefault();
                if (!this.hasError()) {
                    this.onSave(this, e);
                }
                return false;
            },this))
            .end()
        .find('.preview')
            .attr('src', imageDataUrl)
            .end()
        .find('.tenkoku-input:input')
            .val(defaultName)
            .keyup($.proxy(function (e) {
                normalizeTenkoku(e);
                this.updateTenkoku(e.target.value);
            }, this))
            .change($.proxy(function (e) {
                normalizeTenkoku(e);
                this.updateTenkoku(e.target.value);
            }, this))
            .end()
        .find('[name=Comment]')
            .keyup($.proxy(function (e) {
                this.comment = e.target.value;
                this.validate();
            }, this))
            .end()
        ;

    // Replay
    this.content
        .find('a.replay')
            .click($.proxy(function (e) {
                    e.preventDefault();

                    // stop replay if player is running
                    if (TheShodo.Shodo.Write.CurrentPlayer != null) {
                        TheShodo.Shodo.Write.CurrentPlayer.stop();
                        return;
                    }

                   $(e.target).text(TheShodo.Shodo.Resources.Write.String.Panel_Replay_Stop || 'Stop');
                    this.content.find('.tenkoku').fadeOut();
                
                    // swap img -> canvas
                    var img = this.content.find('img.preview').get(0);
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    this.content.find('img.preview').replaceWith(canvas);

                    // Player Setup
                    TheShodo.Shodo.Write.CurrentPlayer = new TheShodo.Shodo.Player(canvas.width,
                                                                                   canvas.height,
                                                                                   canvas,
                                                                                   {
                                                                                         Version: 2
                                                                                       , Strokes: JSON.stringify(TheShodo.Shodo.Shared.StrokeManager.strokeHistory)
                                                                                       , Width:   TheShodo.Shodo.Shared.StrokeEngine.width
                                                                                       , Height:  TheShodo.Shodo.Shared.StrokeEngine.height
                                                                                   });
                    TheShodo.Shodo.Write.CurrentPlayer.backgroundImage = $('#hanshi-image').get(0);
                    TheShodo.Shodo.Write.CurrentPlayer.onStopped = $.proxy(function () {
                        // swap canvas -> img
                        TheShodo.Shodo.Write.CurrentPlayer = null;
                        $(canvas).replaceWith(img);
                        
                        if (this.getTenkoku() != "") {
                            this.content.find('.tenkoku').fadeIn();
                        }
                        
                        $(e.target).text(TheShodo.Shodo.Resources.Write.String.Panel_Replay || 'Replay');
                    }, this);
                    
                    TheShodo.Shodo.Write.CurrentPlayer.play();

                }, this))
                .end()
        ;

    this.updateTenkoku(defaultName);
}
TheShodo.Shodo.Write.PanelFinish.prototype.onPanelClosed = function () {
    if (TheShodo.Shodo.Write.CurrentPlayer != null) {
        TheShodo.Shodo.Write.CurrentPlayer.stop();
        TheShodo.Shodo.Write.CurrentPlayer = null;
    }
}

TheShodo.Shodo.Write.PanelFinish.prototype.onSave = function (sender, e) {}

//
// -- Loading Panel ------------------------------------------------------
//
TheShodo.Shodo.Write.LoadingPanel = {}
TheShodo.Shodo.Write.LoadingPanel.initialize = function () {
    this.loadingPanel = new TheShodo.FloatingPanel("Loading...",
                                                   $('#floating-panel-content-loading').html(),
                                                   {
                                                     hasTitle: false,
                                                     hasButtons: false,
                                                     className: 'panel-loading',
                                                     maskClassName: 'panel-loading-mask',
                                                     isolated: true
                                                   });
}

TheShodo.Shodo.Write.LoadingPanel.show = function () {
    if (!this.loadingPanel)
        this.initialize();
    this.loadingPanel.show();
}

TheShodo.Shodo.Write.LoadingPanel.close = function () {
    this.loadingPanel.close();
}

//
// -- Error Panel ------------------------------------------------------
//
TheShodo.Shodo.Write.ErrorMessageBox = function (message) {
    this.title = '';
    this.message = message;
    this.className = 'error-message-box';
    this.hasClose = false;
    this.hasButtons = true;
    this.hasTitle = false;
    this.buttons = [ { label: 'Return', isCancel: true } ];
}
TheShodo.Shodo.Write.ErrorMessageBox.prototype = new TheShodo.FloatingPanel.MessageBox('', TheShodo.Shodo.Resources.Write.String.Error);
TheShodo.Shodo.Write.ErrorMessageBox.show = function (message) {
    new TheShodo.Shodo.Write.ErrorMessageBox(message).show();
}

//
// -- Entry Panel -----------------------------------------------------------
//
TheShodo.Shodo.Write.EntryPanel = function (url, backUrl) {
    this.url = url;
    this.backUrl = backUrl || url;
}

TheShodo.Shodo.Write.EntryPanel.prototype = new TheShodo.FloatingPanel('', '<iframe frameborder="0" framespacing="0" width="726" height="470"></iframe>', {
    className : 'shodo-work-detail-dialog'
});

TheShodo.Shodo.Write.EntryPanel.prototype.onPanelClosed = function () {
    this.panelBodyContent.find('iframe').stop();
    window.location.href = this.backUrl;
    return true;
};
        
TheShodo.Shodo.Write.EntryPanel.prototype.onBeforePanelShow = function () {
    this.panelBodyContent.find('iframe:first').attr('src', this.url);
}