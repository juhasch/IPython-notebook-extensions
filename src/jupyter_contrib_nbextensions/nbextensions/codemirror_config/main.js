// Allow custom CodeMirror configuration settings
//

define([
    'base/js/namespace',
    'jquery',
    'require',
    'base/js/events',
    'services/config',
    'notebook/js/codecell',
    'codemirror/lib/codemirror',
], function (Jupyter, $, require, events, configmod, codecell, CodeMirror) {
    "use strict";

    // define default config parameter values
    var params = {
        codemirror_blinkrate : 0,
        codemirror_autoclosebrackets : true
    };

    // updates default params with any specified in the provided config data
    var update_params = function (config_data) {
        for (var key in params) {
            if (config_data.hasOwnProperty(key)) {
                params[key] = config_data[key];
            }
        }
    };

    var on_config_loaded = function () {
        if (Jupyter.notebook !== undefined) {
            Jupyter.notebook.get_cells().map(
                function(c) { c.code_mirror.options.cursorBlinkRate=params.codemirror_blinkrate;
                              if (c instanceof codecell.CodeCell) {
                                  c.code_mirror.state.closeBrackets = params.codemirror_autoclosebrackets;
                              }
                })

            CodeMirror.defaults.cursorBlinkRate=params.codemirror_blinkrate;
        }
    };


    /**
     * Load my own CSS file
     *
     * @param name off CSS file
     *
     */
    var load_css = function (name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl(name, 'css');
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    /**
     * Initialize extension
     *
     */
    var load_extension = function () {
        // first, check which view we're in, in order to decide whether to load
        var conf_sect;
        if (Jupyter.notebook) {
            // we're in notebook view
            conf_sect = Jupyter.notebook.config;
        }
        else if (Jupyter.editor) {
            // we're in file-editor view
            conf_sect = new configmod.ConfigSection('notebook', {base_url: Jupyter.editor.base_url});
            conf_sect.load();
        }
        else {
            // we're some other view like dashboard, terminal, etc, so bail now
            return;
        }

        conf_sect.loaded
        .then(function () { update_params(conf_sect.data); })
        .then(on_config_loaded);

    };

    return {load_ipython_extension : load_extension};
});
