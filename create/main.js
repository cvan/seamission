(function() {
    var d = document;
    var $d = $(d);

    var submitType = null;
    var submitContent = d.querySelector('.submit-content');
    var hosted = d.querySelector('[data-type=hosted]');
    var packaged = d.querySelector('[data-type=packaged]');

    var $manifest = $('input[name=manifest]');
    var $validate = $('button[name=validate]');
    var $validateForm = $('.form-validate');

    function toggleSubmitTypes() {
        return;
        var hash = window.location.hash;
        if (hash === '#hosted') {
            submitContent.dataset.submitType = submitType = 'hosted';
            packaged.classList.remove('selected');
            hosted.classList.add('selected');
            $manifest.focus();
        } else {
            submitContent.dataset.submitType = submitType = 'packaged';
            packaged.classList.add('selected');
            hosted.classList.remove('selected');
        }
    }
    window.addEventListener('hashchange', function() {
        toggleSubmitTypes();
    }, false);
    toggleSubmitTypes();

    function escapeText(txt) {
        return document.createTextNode(txt).textContent;
    }

    // Error checking for the form.
    function checkValid(form) {
        if (form) {
            $(form).filter(':not([novalidate])').find('button[type=submit]').attr('disabled', !form.checkValidity());
        }
    }
    $d.on('change keyup paste', 'input, select, textarea', function(e) {
        var $this = $(this);
        // Add classes so we can make red errors only after some bad data has
        // been input.
        $this.addClass('focused');
        $this.closest('label').addClass('focused').toggleClass('invalid', !this.checkValidity());
        $this.siblings('label').addClass('focused').toggleClass('invalid', !this.checkValidity());
        checkValid(e.target.form);
    }).on('loaded decloak', function() {
        $('form:not([novalidate])').each(function() {
            checkValid(this);
        });
        $('form[novalidate] button[type=submit]').prop('disabled', false);
    });

    // Use this if you want to disable form inputs while the post/put happens.
    function toggleSubmitFormState($formElm, enabled) {
        $formElm.find('textarea, button, input').prop('disabled', !enabled);
        if (enabled) {
            checkValid($formElm[0]);
        }
    }

    var $phoneApp = $('.phone-app');
    var $manifest = $('.manifest');

    function isArray(list) {
        return typeof list === 'object' && list.hasOwnProperty('length');
    }

    function arrayRemoveByKey(array, value) {
        var idx = null;
        while ((idx = array.indexOf(value)) !== -1) {
            array.splice(idx, 1);
        }
        return array;
    }

    function Manifest(defaultObj) {
        this.data = defaultObj || {};
        this.render();
    }
    Manifest.prototype = {
        render: function() {
            var pretty = JSON.stringify(this.data, function(k, v) {
                // Show only non-empty values.
                if (isArray(v)) {
                    if (!v.length) {
                        return undefined;
                    }
                    v.sort();
                }
                return v || undefined;
            }, 4);
            $manifest.val(pretty);
        },
        set: function(k, v) {
            this.data[k] = v;
            this.render();
        },
        get: function(k) {
            return this.data[k];
        }
    };

    var manifest = new Manifest({
        name: 'My App'
    });

    // Update manifest on change.
    $d.on('keyup change paste blur', '[data-manifest=string]', function() {
        var $this = $(this);
        var val = $this.val();
        manifest.set($this.attr('name'), val || $this.attr('placeholder'));
    }).on('keyup change paste blur', '[data-manifest=boolean]', function() {
        var $this = $(this);
        var val = $this.val();
        if (val === 'false') {
            val = false;
        }
        manifest.set($this.attr('name'), !!val);
    }).on('keyup change paste blur', '[data-manifest=list]', function() {
        var $this = $(this);
        var name = $this.attr('name');
        var val = $this.val();

        var list = manifest.get(name);
        // `list` is an array.
        if (isArray(list)) {
            if (list.indexOf(val) === -1) {
                list.push(val);
            }
        } else {
            list = [val];
        }

        if (!$this.is(':checked')) {
            arrayRemoveByKey(list, val);
        }

        manifest.set(name, list);
    });

    $d.on('keyup change paste blur', 'input[name=name]', function() {
        var $this = $(this);
        var val = $this.val() || $phoneApp.data('defaultName');
        $phoneApp.text(val);
    }).on('keyup change paste blur', 'input[name=icon]', function() {
        var $this = $(this);
        var val = $this.val();
        var valid = !!val && this.checkValidity();
        console.log(val)
        // TODO: Escape text.
        // TODO: Wait a few seconds until the user is done before rendering.
        $phoneApp.attr('data-icon', val)
                 .css('background-image', 'url(' + escapeText(val) + ')');
        if (valid) {
            $phoneApp.removeClass('phone-default');
        } else {
            $phoneApp.css('background-image', '').addClass('phone-default');
        }
    });

    // Prefix with `http://` if the user didn't supply it.
    $d.on('blur', 'input[type=url]', function() {
        var $this = $(this);
        var val = $this.val();
        if (!val) {
            return;
        }
        if (val.substring(0, 2) === '//') {
            $this.val(val.replace('//', 'http://'));
        } else if (!this.checkValidity() &&
                   val.substring(0,7) !== 'http://') {
            $this.val('http://' + val);
        }
    }).find('input[type=url]').each(function() {
        // Set defaults.
        var $this = $(this);
        if (!$this.attr('pattern')) {
            $this.attr('pattern', 'https?://.*');
        }
        if (!$this.attr('placeholder')) {
            $this.attr('placeholder', 'http://');
        }
    });

    var caps = {
        localStorage: false,
        sessionStorage: false
    };

    try {
        if ('localStorage' in window && window['localStorage'] !== null) {
            caps.localStorage = true;
        }
    } catch (e) {
    }

    var hasSessionStorage = false;
    try {
        if ('sessionStorage' in window && window['sessionStorage'] !== null) {
            caps.sessionStorage = true;
        }
    } catch (e) {
    }

    $d.on('submit', '.form-validate', function(e) {
        e.preventDefault();
        toggleSubmitFormState($validateForm);
        $.post('http://datapi.pe/url?' + $manifest.val()).done(function(data) {
            $manifest.val('');
            toggleSubmitFormState($validateForm, true);
            $('.cloak').trigger('dismiss');
            notify({message: gettext('Feedback submitted. Thanks!')});
        }).fail(function() {
            forms.toggleSubmitFormState($validateForm, true);
            alert('There was a problem submitting your feedback. Try again soon.');
        });
    });

    if ($manifest.length) {
        var manifestVal = $manifest.val();
        if (!manifestVal && hasSessionStorage) {
            $manifest.val(window.sessionStorage.manifest_url);
        }
        var attempts = manifestVal.length;
        $d.on('keyup change paste blur', 'input[name=manifest]', function(e) {
            if (!this.checkValidity()) {
                return;
            }
            // TODO: Hide the other form fields/buchets while validating.

            manifestVal = $manifest.val();

            // Count the keyups to watch for a paste (which we'll assume is attempts=1).
            attempts++;
            if (!manifestVal) {
                attempts = 0;
            }
            // Was a paste so validate immediately.
            if (e.type == 'paste' || (attempts == 1 && manifestVal.length >= 8)) {
                $validate.removeAttr('disabled');
                //$validateForm.submit();
            }
        }).trigger('keyup');
    }

})();
