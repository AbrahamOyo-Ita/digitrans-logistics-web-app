function spreadsheetSafe(value){
 if(typeof value==='string'&&/^[\t\r=+\-@]/.test(value))return `'${value}`;
 return value??'';
}

function csvCell(value){
 const text=String(spreadsheetSafe(value));
 return /[\",\n\r]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
}

export function rowsToCsv(rows=[],columns=[]){
 const header=columns.map(column=>csvCell(column.label??column.key));
 const body=rows.map(row=>columns.map(column=>csvCell(row?.[column.key])).join(','));
 return `\uFEFF${[header.join(','),...body].join('\r\n')}\r\n`;
}

export function downloadCsv(filename,rows,columns){
 if(typeof document==='undefined'||typeof URL?.createObjectURL!=='function')throw new Error('CSV downloads are only available in a browser.');
 const blob=new Blob([rowsToCsv(rows,columns)],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=url;anchor.download=String(filename||'digitrans-export.csv');anchor.style.display='none';
 document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
}
