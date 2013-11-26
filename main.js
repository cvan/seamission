(function() {
    var d = document;
    var $d = $(d);
    var submitType = null;
    var submitContent = d.querySelector('.submit-content');
    var hosted = d.querySelector('[data-type=hosted]');
    var packaged = d.querySelector('[data-type=packaged]');
    function toggleSubmitTypes() {
        var hash = window.location.hash;
        if (hash === '#hosted') {
            submitContent.dataset.submitType = submitType = 'hosted';
            packaged.classList.remove('selected');
            hosted.classList.add('selected');
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

    // Prefix with `http://` if we didn't supply it.
    $d.on('blur', 'input[name=manifest]', function() {
        var $this = $(this);
        var val = $this.val();
        if (val.substring(0, 2) === '//') {
            $this.val(val.replace('//', 'http://'));
        } else if (val.substring(0, 5) !== 'http:' &&
                   val.substring(0, 6) !== 'https:') {
            $this.val('http://' + val);
        }
    });
})();
