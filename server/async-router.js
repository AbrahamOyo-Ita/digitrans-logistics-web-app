import {Router} from 'express';

const methods=['all','delete','get','head','options','patch','post','put'];

function asyncHandler(handler){
  return function routeHandler(req,res,next){
    Promise.resolve(handler(req,res,next)).catch(next);
  };
}
function wrap(handler){
  if(Array.isArray(handler))return handler.map(wrap);
  if(typeof handler==='function'&&handler.constructor?.name==='AsyncFunction')return asyncHandler(handler);
  return handler;
}

export function asyncRouter(){
  const router=Router();
  for(const method of methods){
    const register=router[method].bind(router);
    router[method]=(...args)=>register(...args.map(wrap));
  }
  const use=router.use.bind(router);
  router.use=(...args)=>use(...args.map(wrap));
  return router;
}
