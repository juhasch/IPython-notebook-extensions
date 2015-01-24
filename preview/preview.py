# Notebook Server Extension
#
from IPython.utils.path import get_ipython_dir
from IPython.html.utils import url_path_join as ujoin
from IPython.html.base.handlers import IPythonHandler, json_errors


from IPython.nbconvert.exporters import HTMLExporter
import IPython.nbformat
from IPython.config import Config
from IPython.utils.path import get_ipython_dir

from tornado import web
import os
import sys
import yaml
import json
import time

class ListingHandler(IPythonHandler):
    """List notebooks with preview"""
    @web.authenticated
    def get(self):
        ipythondir = get_ipython_dir()
        cwd = os.getcwd()
        
        ipynb_list = []
        files = [ f for f in os.listdir('.') if os.path.isfile(f) ]
        ipynb_files = [ f for f in files if os.path.splitext(f)[1] == '.ipynb']

        preview_dir = 'html-preview'
        if not os.path.exists(preview_dir):
            os.mkdir(preview_dir)

        c = Config()
        HTMLExporter.template_path = [os.path.join(ipythondir,'templates') ]
        HTMLExporter.template_file = 'hide_input_output'
        exportHtml = HTMLExporter(config=c)
        
        mod_time = []
        html_preview = []
        for ipynb in ipynb_files:
            self.log.info("ipynb: %s" % ipynb)
            ipynb_modtime = os.path.getmtime(ipynb)
            t = time.localtime(ipynb_modtime)
            t = time.strftime("%a, %d %b %Y %H:%M:%S", t)
            mod_time.append(t)

            # test if we need to rebuild
            target = os.path.join(preview_dir, os.path.splitext(ipynb)[0] + '.html')            
            target_png = os.path.join(preview_dir, os.path.splitext(ipynb)[0] + '.html.png')            
            if os.path.isfile(target_png) is True:
                png_modtime = os.path.getmtime(target_png)
                if ipynb_modtime < png_modtime:
                    target_url = target_png.replace('\\', '/')
                    html_preview.append(target_url)
                    continue
                    
            if os.path.isfile(target) is True:
                png_modtime = os.path.getmtime(target)
                if ipynb_modtime < png_modtime:
                    target_url = target.replace('\\', '/')
                    html_preview.append(target_url)
                    continue
                
            a=exportHtml.from_filename(ipynb)           
            f = open(target,'w', encoding="utf8")
            f.write(a[0])
            f.close()
            target_url = target.replace('\\', '/')
           
            html_preview.append(target_url)

        # Build a list of ipynb files in current directory
        # containing at least the following entries:
        #   Name         - unique name of the extension
        #   Description  - short explanation of the extension
        #   Main         - main file that is loaded, typically 'main.js'
        #

        self.write(self.render_template('preview.html',
            base_url = self.base_url,
            ipynb_files = json.dumps(ipynb_files),
            mod_time = json.dumps(mod_time),
            html_preview = json.dumps(html_preview),
            page_title="Notebook Listing"
            )
        )
		
def load_jupyter_server_extension(nbapp):
    webapp = nbapp.web_app
    base_url = webapp.settings['base_url']
    webapp.add_handlers(".*$", [
        (ujoin(base_url, r"/listing/"), ListingHandler)
    ])
