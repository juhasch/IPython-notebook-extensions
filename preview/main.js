// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.

require([
    'jquery',
    'base/js/namespace',
    'base/js/utils',
    'base/js/page',
    'base/js/events',
    'contents',
    'services/config',
    
], function( 
    $,
    IPython,
    utils,
    page,
    events,
    contents,
    configmod
    
    ){
    
    var send_to_server = function(name,path,msg) {
        if (name == '') {
            name = uniqueid() + '.' + msg.match(/data:image\/(\S+);/)[1];
            }
        var path = path.substring(0, path.lastIndexOf('/')) + '/';
        if (path === '/') path = '';
        var url = '//' + location.host + '/api/contents/' + path + name;
        var img = msg.replace(/(^\S+,)/, ''); // strip header
        console.log("Name:",name)
        var data = {'name': name, 'format':'base64', 'content': img, 'type': 'file'}
        var settings = {
            processData : false,
            cache : false,
            type : "PUT",
            dataType : "json",
            data : JSON.stringify(data),
            headers : {'Content-Type': 'text/plain'},
            async : false,
            success : function (data, status, xhr) {
                console.log("SUCCESS:", status)
                },
            error : function() {console.log('Failed to send to server:',name); },
        };
        $.ajax(url, settings);
    }        
    
    
    page = new page.Page();

    var base_url = utils.get_body_data('baseUrl');
    var ipynb_files = $('body').data('ipynb-files')
    var mod_time = $('body').data('mod-time')
    var html_preview = $('body').data('html-preview')

    var html = ""

    for(var i=0; i < ipynb_files.length; i++) {
    //for(var i=0; i < 2; i++) {    
        var pv = base_url + 'files/' + html_preview[i]
        console.log("PV:", pv)
        var nb = ipynb_files[i];
        console.log("NB:", nb)
        var md = mod_time[i] 

        html += '<div class="row">\n'
               +'  <div class="row">\n'
               +'    <div class="col-xs-8 col-sm-6">\n'       
        html += '<span id=test><iframe src="' + pv + '" width=400 height=400></iframe></span>'
        //html += '<span id=test><iframe src="' + pv + ".png" + '" width=400 height=400></iframe></span>'
        html += '    </div>';
        html += '    <div class="col-xs-4 col-sm-6">'
        html += "<h3>" + nb + "</h3><br>"
        html += "Date: " + md + "<br>"
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
        
/*        html += '    <img src="' + icon + '" height="120px" /></div>'

        html += '    <div class="col-xs-4 col-sm-6">'
               +'      <div class="col-sm-9">'
               +'        <h3>' + extension['Name'] + '</h3></div>'

        html += '<div class="col-sm-9">' + extension['Description'] + 
                ' <a href="' + extension['Link'] + '">more...</a></div><br>'
        html += '<div class="col-sm-9">'
               +'<button type="button" class="btn btn-primary" id="' 
                    + id + '-on" >Activate</button>'
               +'<button type="button" class="btn btn-default" disabled="disabled" id="' 
                    + id + '-off" >Deactivate</button>'  
               +'</div></div></div></div><hr>'


    html += "<pre>"+ipynb_files[i]+'</pre><br>'; */
    }  
    
	$("#listing-container").html(html)
    
    
    var onComplete = function(el) {
        var e = el.contents().contents()[1]
        html2canvas(e, { width : 400, height: 400, 
            onrendered: function(canvas) {
                var img = canvas.toDataURL()
                //console.log("canvas:",canvas)
                //console.log("e:",el[0].contentDocument.URL)
                var name = el[0].contentDocument.URL
                name = name.split('/');
                //name = name[name.length-1].split('.')[0];
                name = "html-preview/" + name[name.length-1] + ".png"
                //console.log
                send_to_server(name,"",img)
                el[0].parentElement.html(html)
            }
        });
    }

    page.show();
    var doZoom = function() {
        var iframes = $('iframe');
        //$('iframe').zoomer({ width: 400, height: 400, zoom: 0.5, onComplete: onComplete  });
    }
    require([ '/nbextensions/html2canvas.js', '/nbextensions/jquery.zoomer.js'], doZoom)
	
});
