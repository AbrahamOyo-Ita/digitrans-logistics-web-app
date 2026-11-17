import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';

const root=document.getElementById('root');
if(!root)throw new Error('Missing application root element.');
createRoot(root).render(<React.StrictMode><App/></React.StrictMode>);
if(import.meta.env.PROD&&'serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{}));
}
