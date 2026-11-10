/* Zahnarztpraxis Elberg & Kollegen – Entwurf. Keine Cookies, kein Tracking. */
(function(){
  'use strict';
  var $=function(s,r){return (r||document).querySelector(s);};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};

  /* ---------- Sprechzeiten (Website der Praxis, Stand 10.11.2026) ---------- */
  function z(s){var p=s.split(':');return (+p[0])*60+(+p[1]);}
  function b(a,e){return [z(a),z(e)];}
  var ZEITEN={1:[b('8:00','12:00'),b('14:00','18:00')],2:[b('8:00','12:00'),b('14:00','18:00')],3:[b('8:00','12:00')],4:[b('8:00','12:00'),b('14:00','18:00')],5:[b('8:00','14:00')]};
  var FEIERTAGE=['2026-01-01','2026-04-03','2026-04-06','2026-05-01','2026-05-14','2026-05-25','2026-06-04','2026-10-03','2026-11-01','2026-12-25','2026-12-26',
                 '2027-01-01','2027-03-26','2027-03-29','2027-05-01','2027-05-06','2027-05-17','2027-05-27','2027-10-03','2027-11-01','2027-12-25','2027-12-26'];
  var TAG=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  function jetzt(){
    var d=new Date();
    try{
      var t={};new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).forEach(function(p){t[p.type]=p.value;});
      var y=+t.year,m=+t.month,da=+t.day;
      return {y:y,m:m,d:da,wd:new Date(Date.UTC(y,m-1,da)).getUTCDay(),min:(+t.hour)*60+(+t.minute)};
    }catch(e){return {y:d.getFullYear(),m:d.getMonth()+1,d:d.getDate(),wd:d.getDay(),min:d.getHours()*60+d.getMinutes()};}
  }
  function iso(j){return j.y+'-'+String(j.m).padStart(2,'0')+'-'+String(j.d).padStart(2,'0');}
  function uhr(min){return Math.floor(min/60)+':'+String(min%60).padStart(2,'0');}
  function bloecke(j){return FEIERTAGE.indexOf(iso(j))>-1?[]:(ZEITEN[j.wd]||[]);}
  function naechster(j){
    for(var i=1;i<=10;i++){
      var dt=new Date(Date.UTC(j.y,j.m-1,j.d+i));
      var k={y:dt.getUTCFullYear(),m:dt.getUTCMonth()+1,d:dt.getUTCDate(),wd:dt.getUTCDay()};
      var bl=bloecke(k); if(bl.length) return (i===1?'morgen':TAG[k.wd])+' ab '+uhr(bl[0][0]);
    }
    return '';
  }
  function status(){
    var j=jetzt(), bl=bloecke(j), wort='Geschlossen', rest='', offen=false;
    for(var i=0;i<bl.length;i++){
      if(j.min>=bl[i][0]&&j.min<bl[i][1]){offen=true;wort='Jetzt geöffnet';rest='bis '+uhr(bl[i][1])+' Uhr';break;}
      if(j.min<bl[i][0]){wort=i===0?'Öffnet heute':'Mittagspause';rest=(i===0?'um ':'bis ')+uhr(bl[i][0])+' Uhr';break;}
    }
    if(!offen&&wort==='Geschlossen'){var n=naechster(j);rest=n?'wieder '+n+' Uhr · online buchen geht immer':'';}
    var s=$('[data-status]');
    if(s){s.classList.toggle('zu',!offen);$('[data-status-wort]',s).textContent=wort;$('[data-status-rest]',s).textContent=rest;}
    $$('#zeiten tr[data-tag]').forEach(function(tr){tr.classList.toggle('heute',+tr.dataset.tag===j.wd&&bl.length>0);});
  }
  status(); setInterval(status,60000);

  /* ---------- Sonde ---------- */
  var MM=22, RAND=170;
  var regler=$('#tiefe');
  function setze(el,attr){for(var k in attr) el.setAttribute(k,attr[k]);}
  function mischen(a,b,t){var x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);var r=function(s){return Math.round(((x>>s)&255)*(1-t)+((y>>s)&255)*t);};return 'rgb('+r(16)+','+r(8)+','+r(0)+')';}
  function sonde(){
    if(!regler) return;
    var d=parseFloat(regler.value), spitze=RAND+d*MM;
    var komma=d.toFixed(1).replace('.',',');
    $('#tiefe-wert').textContent=komma+' mm';
    setze($('#sonde-schaft'),{y2:spitze}); setze($('#sonde-spitze'),{cy:spitze});
    setze($('#sonde-band'),{y:spitze-5.5*MM,height:2*MM});
    setze($('#sonde-ring1'),{y:spitze-8.5*MM-1.5}); setze($('#sonde-ring2'),{y:spitze-11.5*MM-1.5});
    setze($('#tasche'),{d:'M183 '+RAND+'V'+(spitze+2),'stroke-width':Math.min(3+d*1.1,11)});
    setze($('#schleier'),{y:RAND,height:Math.max(spitze-RAND+6,0)});
    setze($('#mass-linie'),{y2:spitze}); setze($('#mass-ende'),{y1:spitze,y2:spitze});
    var mt=$('#mass-text'); setze(mt,{y:RAND+(spitze-RAND)/2+5}); mt.textContent=komma+' mm';
    var t=Math.max(0,Math.min(1,(d-2.5)/5));
    var farbe=mischen('#E7A9A0','#CF6A5E',t);
    $('#zahnfleisch').setAttribute('fill',farbe); $('#zahnfleisch-links').setAttribute('fill',farbe); $('#schleier').setAttribute('fill',farbe);
    var knochen=Math.min(RAND+(Math.max(d,2)+1.6)*MM,445);
    setze($('#knochen'),{d:'M0 '+(knochen+10)+'C60 '+(knochen+6)+' 120 '+knochen+' 186 '+knochen+'C250 '+knochen+' 300 '+(knochen+4)+' 360 '+(knochen+8)+'V470H0Z'});
    var bf=$('#befund'), st, code, titel, text;
    if(d<=3){st=1;code='PSI-Code 0 bis 2';titel='Gesunde Furche';text='Bis etwa 3 Millimeter ist normal. Das schwarze Band der Sonde bleibt ganz sichtbar.';}
    else if(d<=5.5){st=2;code='PSI-Code 3';titel='Zahnfleischtasche';text='Das schwarze Band verschwindet zum Teil im Zahnfleisch. Jetzt lohnt eine genaue Untersuchung aller Zähne.';}
    else {st=3;code='PSI-Code 4';titel='Tiefe Tasche';text='Das Band ist ganz verschwunden. Meist ist eine systematische Behandlung nötig, damit der Knochen nicht weiter zurückgeht.';}
    bf.dataset.stufe=st; $('[data-code]',bf).textContent=code; $('[data-titel]',bf).textContent=titel; $('[data-text]',bf).textContent=text;
    regler.setAttribute('aria-valuetext',komma+' Millimeter, '+titel);
  }
  if(regler){regler.addEventListener('input',sonde); sonde();}

  /* ---------- Menü ---------- */
  var menue=$('#menue'), nav=$('#nav');
  if(menue){
    menue.addEventListener('click',function(){var o=nav.classList.toggle('offen');menue.setAttribute('aria-expanded',o);});
    $$('#nav a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('offen');menue.setAttribute('aria-expanded','false');});});
  }

  /* ---------- Ansicht ---------- */
  var dlg=$('#ansicht'), html=document.documentElement;
  function lesen(){try{return JSON.parse(localStorage.getItem('ansicht')||'{}');}catch(e){return {};}}
  function schreiben(a){try{localStorage.setItem('ansicht',JSON.stringify(a));}catch(e){}}
  function anwenden(a){
    if(a.schrift) html.dataset.schrift=a.schrift; else delete html.dataset.schrift;
    ['kontrast','ruhe','abstand','links'].forEach(function(k){if(a[k]) html.dataset[k]='1'; else delete html.dataset[k];});
  }
  if(dlg){
    var a=lesen();
    $$('input[name=schrift]',dlg).forEach(function(r){r.checked=(r.value===(a.schrift||''));r.addEventListener('change',function(){var x=lesen();x.schrift=r.value;schreiben(x);anwenden(x);});});
    $$('input[data-opt]',dlg).forEach(function(c){c.checked=!!a[c.dataset.opt];c.addEventListener('change',function(){var x=lesen();x[c.dataset.opt]=c.checked;schreiben(x);anwenden(x);});});
    $('#ansicht-oeffnen').addEventListener('click',function(){if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open','');});
    dlg.addEventListener('click',function(e){if(e.target===dlg) dlg.close();});
  }
  var vor=$('#vorlesen');
  if(vor){
    if(!('speechSynthesis' in window)){vor.hidden=true;}
    else vor.addEventListener('click',function(){
      var s=window.speechSynthesis;
      if(s.speaking){s.cancel();vor.textContent='Seite vorlesen';return;}
      var txt=$('main').innerText.replace(/\s+\n/g,'\n');
      var u=new SpeechSynthesisUtterance(txt); u.lang='de-DE'; u.rate=.95;
      u.onend=function(){vor.textContent='Seite vorlesen';};
      s.speak(u); vor.textContent='Vorlesen beenden';
    });
  }

  /* ---------- Formular ---------- */
  var form=$('#nachricht');
  function weiche(){
    var w=(form.querySelector('input[name=anliegen]:checked')||{}).value;
    $$('[data-nur]',form).forEach(function(el){el.hidden=el.dataset.nur!==w;});
  }
  if(form){
    $$('input[name=anliegen]',form).forEach(function(r){r.addEventListener('change',weiche);});
    weiche();
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var tel=$('#f-tel').value.trim(), mail=$('#f-mail').value.trim(), f=$('#f-fehler');
      if(!tel&&!mail){f.hidden=false;$('#f-tel').setAttribute('aria-invalid','true');$('#f-tel').focus();return;}
      f.hidden=true;
      var w=(form.querySelector('input[name=anliegen]:checked')||{}).value, t;
      if(w==='kollegen') t='In der fertigen Website ginge sie jetzt verschlüsselt an die Praxis. Dr. Elberg oder das Team rufen Ihre Praxis zurück.';
      else if(w==='bewerbung') t='In der fertigen Website ginge Ihre Bewerbung jetzt verschlüsselt an die Praxisleitung. Sie hören von uns.';
      else t='In der fertigen Website ginge sie jetzt verschlüsselt an die Anmeldung. Wir melden uns während der Sprechzeiten.';
      $('[data-danke-text]').textContent=t;
      form.hidden=true; var d=$('#f-danke'); d.hidden=false; d.focus();
    });
  }
  $$('[data-vorwahl]').forEach(function(a){a.addEventListener('click',function(){
    var r=form&&form.querySelector('input[name=anliegen][value="'+a.dataset.vorwahl+'"]');
    if(r){r.checked=true;weiche();}
  });});

  /* ---------- Einblenden ---------- */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('sichtbar');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
    $$('.einblenden').forEach(function(el){io.observe(el);});
  } else $$('.einblenden').forEach(function(el){el.classList.add('sichtbar');});
})();
