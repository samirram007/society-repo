// Inline script to set theme class BEFORE React hydrates (prevents flash)
export const themeScript = `
try{
  var t=localStorage.getItem('theme')||'system';
  var r=document.documentElement;
  r.classList.remove('light','dark');
  if(t==='system'){r.classList.add(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');}
  else{r.classList.add(t==='dark'?'dark':'light');}
  var c=JSON.parse(localStorage.getItem('themeConfig')||'null');
  if(c&&c.lightColors&&c.darkColors){
    var k=t==='dark'?c.darkColors:c.lightColors;
    if(t==='system'){k=window.matchMedia('(prefers-color-scheme:dark)').matches?c.darkColors:c.lightColors;}
    var m={background:'--background',foreground:'--foreground',card:'--card',cardForeground:'--card-foreground',popover:'--popover',popoverForeground:'--popover-foreground',primary:'--primary',primaryForeground:'--primary-foreground',secondary:'--secondary',secondaryForeground:'--secondary-foreground',muted:'--muted',mutedForeground:'--muted-foreground',accent:'--accent',accentForeground:'--accent-foreground',destructive:'--destructive',destructiveForeground:'--destructive-foreground',border:'--border',input:'--input',ring:'--ring'};
    for(var p in m){if(typeof k[p]==='string'&&k[p].length>0)r.style.setProperty(m[p],k[p]);}
    if(typeof c.radius==='number')r.style.setProperty('--radius',c.radius+'rem');
    if(typeof c.fontSans==='string')r.style.setProperty('--font-sans',c.fontSans);
    if(typeof c.fontMono==='string')r.style.setProperty('--font-mono',c.fontMono);
  }
}catch(e){}
`
