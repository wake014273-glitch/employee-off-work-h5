import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {resolveBuildRequest} from '../scripts/serve-build.mjs';

test('preview server rejects malformed URLs and traversal into a sibling with the same path prefix',()=>{
  const root=resolve('temp/server/web');
  assert.deepEqual(resolveBuildRequest(root,'/%E0%A4%A'),{status:400});
  assert.deepEqual(resolveBuildRequest(root,'/asset%00.js'),{status:400});
  assert.deepEqual(resolveBuildRequest(root,'/..%2fweb-secret%2fprivate.txt'),{status:404});
  assert.deepEqual(resolveBuildRequest(root,'/..%5cweb-secret%5cprivate.txt'),{status:404});
  assert.deepEqual(resolveBuildRequest(root,'/?test=1'),{status:200,file:join(root,'index.html')});
  assert.deepEqual(resolveBuildRequest(root,'/assets/%E5%B0%8F%E9%B1%BC.png'),{status:200,file:join(root,'assets/小鱼.png')});
});
