import request from 'request';
import http from 'http';
import path from 'path';
import { fromPairs, chunk } from 'lodash';
import express from 'express';

const trim = (w) => w.trim()

export default function() {

  const app = express();
  app.set('port', process.env.PORT || 4242);
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

  app.set('json spaces', 2);

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  const makeUrl = (text) => {
    const [rest, body] = text.split('§').map(trim);
    const [q, _query = ''] = /\((.*)\)/.exec(rest) || [];
    const subParts = rest.replace(q, '').split('~').map(trim)
    const isMethodDeclared = subParts.length > 1
    const [method, _path] = isMethodDeclared ? subParts : ['get', ...subParts]
    const [host] = _path.trim().split(' ');
    const hostll = host.split('|')[1] || host.split('|')[0];
    const hostl = hostll.split('>')[0];
    const path = '/' + _path.trim().split(' ').slice(1).filter(x => x).join('/')
    const chunks = chunk(_query.split(' '), 2);
    const query = fromPairs(chunks);
    return { method, hostl, path, body, query };
  };

  app.use(({ query, body }, res) => {
    const { text = '' } = body.text ? body : query;
    console.log({ text })
    const { method, hostl, path, query: qs } = makeUrl(text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>'));
    const protocol = 'http://';
    const url = protocol + hostl + path;
    console.log({ url })
    const a = request[method.toLowerCase()]({ url, qs }, (error, _, response) => {
      console.log({ response });
      res.send({ text: JSON.stringify(response).replace(/\[/g, '\n').replace(/\]/g, '\n').replace(/\{/g, '\n').replace(/\}/g, '\n').replace(/"/g, '').replace(/,/g, '\n').replace(/\\/g, '') });
    });
    console.log({ a })
  });

  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });

}
