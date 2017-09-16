"""Embed graphics into HTML Exporter class"""

import base64
import os
import re

from ipython_genutils.ipstruct import Struct
from nbconvert.exporters.html import HTMLExporter

try:
    from urllib.request import urlopen  # py3
except ImportError:
    from urllib2 import urlopen


class EmbedHTMLExporter(HTMLExporter):
    """
    :mod:`nbconvert` Exporter which embeds graphics as base64 into html.

    Convert to HTML and embed graphics (pdf, svg and raster images) in the HTML
    file.

    Example usage::

        jupyter nbconvert --to html_embed mynotebook.ipynb
    """

    def replfunc(self, match):
        """Replace source url or file link with base64 encoded blob."""
        url = match.group(1)
        imgformat = url.split('.')[-1]
        if url.startswith('http'):
            data = urlopen(url).read()
        elif url.startswith('data'):
            img = '<img src="' + url + '"'
            return img
        elif url.startswith('attachment'):
            imgname = url.split(':')[1]
            available_formats = self.attachments[imgname]
            # get the image based on the configured image type priority
            for imgformat in self.config.NbConvertBase.display_data_priority:
                if imgformat in available_formats.keys():
                    b64_data = self.attachments[imgname][imgformat]
                    img = '<img src="data:' + imgformat + \
                          ';base64,' + b64_data + '"'
                    return img
            raise ValueError('Could not find attachment for image "%s" in notebook' % imgname)
        else:
            filename = os.path.join(self.path, url)
            with open(filename, 'rb') as f:
                data = f.read()

        self.log.info("embedding url: %s, format: %s" % (url, imgformat))
        b64_data = base64.b64encode(data).decode("utf-8")
        if imgformat == "svg":
            img = '<img src="data:image/svg+xml;base64,' + \
                b64_data + '"'
        elif imgformat == "pdf":
            img = '<img src="data:application/pdf;base64,' + \
                b64_data + '"'
        else:
            img = '<img src="data:image/' + imgformat + \
                ';base64,' + b64_data + '"'
        return img

    def from_notebook_node(self, nb, resources=None, **kw):
        output, resources = super(
            EmbedHTMLExporter, self).from_notebook_node(nb, resources)

        self.path = resources['metadata']['path']
        self.attachments = Struct()
        for cell in nb.cells:
            if 'attachments' in cell.keys():
                self.attachments += cell['attachments']
        regex = re.compile('<img\s+src="([^"]+)"')

        embedded_output = regex.sub(self.replfunc, output)
        return embedded_output, resources
