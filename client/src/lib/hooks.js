import {useCallback,useEffect,useState} from 'react';
import {api} from './api';
export function useApiData(path,enabled=true){
 const [data,setData]=useState(null),[loading,setLoading]=useState(Boolean(enabled)),[error,setError]=useState(''),[tick,setTick]=useState(0);
 const reload=useCallback(()=>setTick(v=>v+1),[]);
 useEffect(()=>{
  if(!enabled||!path){setLoading(false);return;}
  let live=true;setLoading(true);setError('');
  api(path).then(d=>{if(live)setData(d);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[path,enabled,tick]);
 return {data,loading,error,reload,setData};
}
