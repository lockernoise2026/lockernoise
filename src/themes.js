// Shared theme options for web and Android (Capacitor WebView).
export const THEMES = [
  {id:'electric',name:'Electric Blue + Lime',short:'Blue',preview:['#112cc8','#d7ff1f','#ffffff']},
  {id:'dark',name:'Dark + Lime',short:'Dark',preview:['#0b1019','#d7ff1f','#f8fbff']},
  {id:'light',name:'White + Lime',short:'Light',preview:['#ffffff','#d7ff1f','#15243b']}
];
export const THEME_STORAGE_KEY='lockernoise-theme-v1';
export const validTheme = id => THEMES.some(t=>t.id===id);
export function savedTheme(){
  try {const id=localStorage.getItem(THEME_STORAGE_KEY);return validTheme(id)?id:'electric'}
  catch {return 'electric'}
}
