(function($TS) {

    $(document).ready(function() {
        // Initialize Once
        $TS.FloatingPanel.Shared = {};
        $TS.FloatingPanel.Shared.floatingMask = null;
        $TS.FloatingPanel.Shared.floatingPanel = null;
        $TS.FloatingPanel.Shared.currentPanel = null;
        $TS.FloatingPanel.Shared.currentPanelStack = [];

        $TS.FloatingPanel.Shared.floatingPanelTemplate = $('<div><div class="floating-mask" /></div>').find('.floating-mask').html($('.floating-mask').html()).end().html();
        $TS.FloatingPanel.Shared.floatingMask = $('.floating-mask');
        $TS.FloatingPanel.Shared.floatingPanel = $('.floating-panel', TheShodo.FloatingPanel.Shared.floatingMask);
    });

    $TS.FloatingPanel = function(title, selectorOrContent, options) {
        /// <summary>Create FloatingPanel Instance</summary>
        /// <param name="title">title</param>
        /// <param name="selectorOrContent">a jQuery selector or content HTML</param>
        /// <param name="options">floating panel options (hasButtons, buttons, hasTitle, hasClose, className)</param>
        /*
        [Setup Properties]
        - title
        - selectorOrContent
        - hasButtons
        - hasClose
        - hasTitle
        - buttons
        - className
        - maskClassName
        - isolated
        - cancelOnEscKey

        [Runtime Properties]
        - content
        - mask
        - panel
        - buttonsContainer
        - defaultButton
        - cancelButton
        - panelBodyContent

        [Method]
        - show
        - close

        [Events]
        Note: 'this' == a panel instance.
        - onBeforePanelShow = function (FloatingPanel#show method arguments) {}
        - onPanelShown = function () {}
        - onPanelClosed = function () {}
        - onCloseClicked = function (e) { return true; }
        - onCanceled = function (sender, e, button) {}
        - onButtonClicked = function (button, e) {}
        */
        this.title = title;
        this.selectorOrContent = selectorOrContent;
        this.content = null;
        options = $.extend({
            hasButtons: false,
            hasClose: true,
            hasTitle: true,
            buttons: [],
            className: '',
            maskClassName: '',
            cancelOnEscKey: true
        }, options);

        this.hasButtons = options.hasButtons;
        this.hasClose = options.hasClose;
        this.hasTitle = options.hasTitle;
        this.buttons = options.buttons;
        this.className = options.className;
        this.maskClassName = options.maskClassName;
        this.isolated = options.isolated;
        this.cancelOnEscKey = options.cancelOnEscKey;

        this.panel = null;
        this.buttonsContainer = null;
        this.defaultButton = null;
        this.cancelButton = null;

        this.initialize();
    }

    $TS.FloatingPanel.prototype.initialize = function() {}

    $TS.FloatingPanel.prototype.prepareContent = function() {
        var self = this;
        this.mask = (this.isolated) ? $($TS.FloatingPanel.Shared.floatingPanelTemplate) : $TS.FloatingPanel.Shared.floatingMask;
        this.panel = $('.floating-panel', this.mask);

        if (this.isolated) {
            this.mask.appendTo(document.body);
        }

        this.content = $(this.selectorOrContent);
        this.panelBodyContent = this.panel.find('.floating-panel-body-content');

        this.panel
            .find('.floating-panel-buttons')
            .toggle(this.hasButtons)
            .end()
            .find('.floating-panel-close')
            .toggle(this.hasClose && this.hasTitle)
            .click($.proxy(function(e) {
                e.preventDefault();
                if (this.onCloseClicked(e)) {
                    this.close();
                }
            }, this))
            .end()
            .find('.floating-panel-title')
            .text(this.title)
            .toggle(this.hasTitle)
            .end()
            .find('.floating-panel-body-content')
            .html(this.content)
            .end();

        if (this.className && this.className != '') {
            this.panel.addClass(this.className);
        }
        if (this.maskClassName != null && this.maskClassName != '') {
            this.mask.addClass(this.maskClassName);
        }

        if (this.hasButtons) {
            var buttonsContainer = this.panel.find('.floating-panel-buttons');
            buttonsContainer.show().find('*').remove();

            this.buttons.forEach(function(button) {
                var buttonE = $('<input type="' + (button.isSubmit ? 'submit' : 'button') + '" value="" />')
                    .val(button.label)
                    .addClass(button.className ? button.className : 'button')
                    .click(function(e) {
                        e.preventDefault();
                        self.onButtonClicked(button, e);
                    });
                buttonsContainer.append(buttonE);

                if (self.defaultButton == null) {
                    self.defaultButton = buttonE;
                }

                if (button.isCancel) {
                    buttonE.addClass('cancel');
                    self.defaultButton = buttonE;
                    self.cancelButton = buttonE;
                }
                if (button.isDefault) {
                    self.defaultButton = buttonE;
                }
            });

            this.buttonsContainer = buttonsContainer;
        }

        // cancel event
        if (this.cancelOnEscKey) {
            this.panel
                .keyup(function(e) {
                    // ESC key
                    if (e.keyCode == 27) {
                        if (self.hasClose) {
                            self.close();
                        } else if (self.cancelButton) {
                            self.cancelButton.click();
                        }
                    }
                });
        }

        this.disableAllFocus();
    }

    $TS.FloatingPanel.prototype.dispose = function() {
        if (this.maskClassName != null && this.maskClassName != '') {
            this.mask.removeClass(this.maskClassName);
        }
        if (this.className != null && this.className != '') {
            this.panel.removeClass(this.className);
        }

        // drop all content
        this.panel.find('.floating-panel-body-content').html('');

        // unbind events
        this.panel.find('.floating-panel-close').unbind('click');

        this.enableAllFocus();

        if (this.isolated) {
            // Remove from document
            this.mask.remove();
        }
    }

    $TS.FloatingPanel.prototype.preventFocus = function(e) {
        if ($(e.target).parents('.floating-panel-body').length == 0) {
            e.preventDefault();
            $(this.panel).find('a:visible,input:visible,button:visible').get(0).focus();
        }
    }

    $TS.FloatingPanel.prototype.disableAllFocus = function() {
        $('body').delegate('a, input, button', 'focusin', $.proxy(this.preventFocus, this));
    }

    $TS.FloatingPanel.prototype.enableAllFocus = function() {
        $('body').undelegate('a, input, button', 'focusin', $.proxy(this.preventFocus, this));
    }

    $TS.FloatingPanel.prototype.show = function() {
        /// <summary>Show Floating Panel</summary>
        var self = this;
        var args = Array.prototype.slice.apply(arguments);

        if (!this.isolated) {
            if ($TS.FloatingPanel.Shared.currentPanel) {
                $TS.FloatingPanel.Shared.currentPanel.close(true, function() { self.show.apply(self, args); });
                return; // after
            }
        }

        this.prepareContent();
        this.onBeforePanelShow.apply(this, Array.prototype.slice.apply(arguments));

        this.panel.css('top', '48%').show().css('opacity', 0);

        this.mask.fadeIn('fast', function() {
            //$TS.FloatingPanel.Shared.floatingPanel.fadeIn('fast', self.onPanelShown);
            self.panel.animate({ opacity: 1, top: '50%' }, 100, function(e) {
                if (self.defaultButton != null && self.defaultButton != undefined) {
                    self.defaultButton.focus();
                }
                self.onPanelShown(e);
            });
        });

        if (!this.isolated) {
            $TS.FloatingPanel.Shared.currentPanel = this;
        }
        $TS.FloatingPanel.Shared.currentPanelStack.push(this);
    }

    $TS.FloatingPanel.prototype.close = function(preventHideMask, onAfterClosed) {
        /// <summary>Close Floating Panel</summary>
        /// <param name="preventHideMask">Prevent hiding a mask layer</param>
        /// <param name="onAfterClosed">Handle on a floating panel closed.</param>
        var self = this;

        if (!this.isolated) {
            $TS.FloatingPanel.Shared.currentPanel = null;
        }
        $TS.FloatingPanel.Shared.currentPanelStack.pop();

        //$TS.FloatingPanel.Shared.floatingPanel.fadeOut('fast', function () {
        this.panel.animate({ opacity: 0, top: '52%' }, 100, function() {
            if (self.onPanelClosed)
                self.onPanelClosed();

            self.dispose();

            if (!preventHideMask) {
                self.mask.fadeOut('fast', function() {
                    if (onAfterClosed)
                        onAfterClosed();
                });
            } else {
                if (onAfterClosed)
                    onAfterClosed();
            }
        });

    }

    // Events
    $TS.FloatingPanel.prototype.onBeforePanelShow = function( /* FloatingPanel#show method arguments */ ) {}
    $TS.FloatingPanel.prototype.onPanelShown = function() {}
    $TS.FloatingPanel.prototype.onPanelClosed = function() {}
    $TS.FloatingPanel.prototype.onCloseClicked = function(e) {
        return true; }
    $TS.FloatingPanel.prototype.onCanceled = function(sender, e, button) {}
    $TS.FloatingPanel.prototype.onButtonClicked = function(button, e) {
        if (button.isCancel) {
            if (button.onClick)
                button.onClick(this, e);
            this.close();
        } else {
            if (button.onClick)
                button.onClick(this, e);
        }
    }


    // -- Confirm Panel
    $TS.FloatingPanel.MessageBox = function(title, message, buttons, hasClose) {
        /// <summmary>FloatingPanel: Generic Message Box</summary>
        /// <example>
        /// var confirmPanel = new TheShodo.FloatingPanel.MessageBox("Hauhau?", "Really?", [
        ///                                                                                  { label:"OK",     onClick:function() { alert('OK'); } },
        ///                                                                                  { label:"Cancel", isCancel:true }
        ///                                                                                ]);
        /// confirmPanel.show();
        /// </example>
        this.title = title;
        this.message = message;
        this.buttons = buttons;
        this.hasButtons = true;
        this.hasClose = hasClose || false;
        this.className = 'panel-messagebox';
        this.isolated = true;
        this.hasTitle = (this.title != null && this.title != '');
    }
    $TS.FloatingPanel.MessageBox.prototype = new $TS.FloatingPanel('Confirm', '<div><p class="label"></p><menu class="buttons"></menu></div>');

    $TS.FloatingPanel.MessageBox.prototype.onBeforePanelShow = function() {
        var self = this;
        this.content
            .find('.label')
            .text(this.message)
            .end();
    }
    $TS.FloatingPanel.MessageBox.show = function(title, message, buttons, hasClose) {
        new $TS.FloatingPanel.MessageBox(title, message, (buttons || [{ label: 'OK', isCancel: true, isDefault: true }]), hasClose).show();
    }

})(window.TheShodo);
