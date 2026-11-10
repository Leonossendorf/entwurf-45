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
    var satz=offen?'Die Praxis ist gerade geöffnet, '+rest+'.':(wort==='Geschlossen'?'Die Praxis ist gerade geschlossen'+(naechster(j)?', wieder '+naechster(j)+' Uhr.':'.'):wort+' '+rest+'.');
    $$('[data-status-satz]').forEach(function(p){p.textContent=satz;});
    $$('#zeiten tr[data-tag]').forEach(function(tr){tr.classList.toggle('heute',+tr.dataset.tag===j.wd&&bl.length>0);});
  }
  status(); setInterval(status,60000);

  /* ---------- Zahn im Schnitt mit Messsonde ----------
     Maßstab: 22 Einheiten = 1 mm. Zahnfleischrand 2,2 mm über der Schmelz-Zement-Grenze.
     WHO-Sonde: Kugel 0,5 mm, schwarzes Band 3,5 bis 5,5 mm, Ringe bei 8,5 und 11,5 mm. */
  var regler=$('#tiefe'), zahn=$('#zahn');
  if(regler&&zahn&&$('#kontur-r').getTotalLength){(function(){
    var S=22, CEJ=222, YG=CEJ-2.2*S, KAMM=266, NS='http://www.w3.org/2000/svg';
    var kontur=$('#kontur-r'), wurzel=$('#wurzel');
    function attr(el,o){for(var k in o) el.setAttribute(k,o[k]);}
    function r1(n){return Math.round(n*10)/10;}
    function klemme(v,a,b){return Math.max(a,Math.min(b,v));}

    // rechte Zahnkontur: x zu gegebenem y
    var KL=kontur.getTotalLength(), lut=[];
    for(var s=0;s<=KL;s+=1){var p=kontur.getPointAtLength(s);lut.push([p.y,p.x]);}
    function xr(y){
      if(y<=lut[0][0]) return lut[0][1];
      for(var i=1;i<lut.length;i++){ if(lut[i][0]>=y){var a=lut[i-1],b=lut[i],t=(y-a[0])/((b[0]-a[0])||1);return a[1]+(b[1]-a[1])*t;} }
      return lut[lut.length-1][1];
    }
    // Zahnfach: Wurzelkontur um die Breite der Wurzelhaut nach außen versetzt
    var WL=wurzel.getTotalLength(), fach=[], spitze=0;
    for(s=0;s<=WL;s+=4){
      var m=wurzel.getPointAtLength(s), v=wurzel.getPointAtLength(Math.min(s+1,WL)), z=wurzel.getPointAtLength(Math.max(s-1,0));
      var tx=v.x-z.x, ty=v.y-z.y, l=Math.sqrt(tx*tx+ty*ty)||1;
      fach.push({x:m.x+ty/l*6.2, y:m.y-tx/l*6.2});
      if(fach[fach.length-1].y>fach[spitze].y) spitze=fach.length-1;
    }
    var iLinks=fach.length-1; for(var i=fach.length-1;i>spitze;i--){ if(fach[i].y>=KAMM){iLinks=i;break;} }
    var iGesund=0; for(i=0;i<spitze;i++){ if(fach[i].y>=KAMM){iGesund=i;break;} }

    // Zahnstein: feste Lage, erscheint je nach Tiefe
    var steinG=$('#stein'), steine=[], zufall=[.62,.18,.87,.41,.73,.09,.55,.94,.3,.68,.22,.8,.47,.12,.9,.36,.6,.26];
    for(i=0;i<18;i++){
      var sy=YG-7+i*8.6+zufall[i]*3, e=document.createElementNS(NS,'ellipse');
      var rx=1.7+zufall[(i+5)%18]*2.3, ry=3+zufall[(i+11)%18]*3.4, ueber=sy<YG+2;
      attr(e,{cx:r1(xr(sy)+rx*.55),cy:r1(sy),rx:r1(rx),ry:r1(ry),fill:ueber?'#DCCB8E':(i%3?'#4A3D2A':'#6B5A3C'),stroke:ueber?'#B9A766':'#2E2619','stroke-width':.5,opacity:0,transform:'rotate('+r1(-8+zufall[(i+3)%18]*10)+' '+r1(xr(sy))+' '+r1(sy)+')'});
      steinG.appendChild(e); steine.push({el:e,y:sy,ueber:ueber});
    }

    var el={ginR:$('#gin-r'),ginClip:$('#gin-r-clip'),kante:$('#gin-r-kante'),licht:$('#gin-r-licht'),entz:$('#entz'),grad:$('#g-entz'),
            kn:$('#kn'),knMark:$('#kn-mark'),knClip:$('#kn-clip'),knRand:$('#kn-rand'),knRand2:$('#kn-rand2'),knAlt:$('#kn-alt'),pdl:$('#pdl-clip'),
            tasche:$('#tasche-rand'),sonde:$('#sonde'),randL:$('#rand-linie'),randT:$('#rand-text'),mass:$('#mass'),massT:$('#mass-text'),
            knH:$('#kn-hinweis'),knZ:$('#kn-zeiger'),knT:$('#kn-text')};

    function zeichne(d){
      var yP=YG+d*S, tx=xr(yP)+6.3;
      var tan=klemme((354.5-tx)/(yP-132),.03,.19);
      function px(y){return tx+(yP-y)*tan;}
      function hw(y){return 2.5+(yP-y)/352*1.9;}
      var t=klemme((d-2.4)/4.2,0,1), sw=t;          // Entzündung und Schwellung
      var yB=Math.max(KAMM, yP+1.6*S);              // Knochenrand folgt der Tasche mit Abstand

      // Taschenwand (Innenseite des Zahnfleischs)
      var innen=[], y;
      for(y=YG+1;y<yP-7;y+=5) innen.push([px(y)+hw(y)+1.4,y]);
      innen.push([tx+6.9,yP-3],[tx+6,yP+3.4],[tx+2,yP+7],[xr(yP+6.5)+.4,yP+6.6]);
      var xm=px(YG)+hw(YG)+1.4;
      var wand='M'+r1(xm)+' '+r1(YG+1)+innen.map(function(q){return 'L'+r1(q[0])+' '+r1(q[1]);}).join('');
      var aussen='C'+r1(xm+2)+' '+r1(YG-8-2*sw)+' '+r1(xm+13+6*sw)+' '+r1(YG-7-2*sw)+' '+r1(xm+21+9*sw)+' '+r1(YG+12)+
                 'C'+r1(xm+28+10*sw)+' '+r1(YG+38)+' '+r1(374+5*sw)+' 244 381 286C392 350 426 440 446 620';
      var ginD=wand+'L262 '+r1(yP+6.6)+'L262 620L446 620C426 440 392 350 381 286C'+r1(374+5*sw)+' 244 '+r1(xm+28+10*sw)+' '+r1(YG+38)+' '+r1(xm+21+9*sw)+' '+r1(YG+12)+
               'C'+r1(xm+13+6*sw)+' '+r1(YG-7-2*sw)+' '+r1(xm+2)+' '+r1(YG-8-2*sw)+' '+r1(xm)+' '+r1(YG+1)+'Z';
      el.ginR.setAttribute('d',ginD); el.ginClip.setAttribute('d',ginD);
      el.kante.setAttribute('d','M'+r1(xm)+' '+r1(YG+1)+aussen);
      el.licht.setAttribute('d','M'+r1(xm+17+9*sw)+' '+r1(YG+22)+'C'+r1(xm+22+10*sw)+' '+r1(YG+44)+' '+r1(369+5*sw)+' 248 375 288C386 350 418 440 438 610');
      el.tasche.setAttribute('d',wand);
      attr(el.grad,{cx:r1(xm+12),cy:r1(YG+10+d*S*.42),r:r1(70+d*17)});
      attr(el.entz,{cx:r1(xm+12),cy:r1(YG+10+d*S*.42),r:r1(70+d*17),opacity:r1(t*100)/100});

      // Knochen
      var iR=iGesund; for(var i=iGesund;i<spitze;i++){ if(fach[i].y>=yB){iR=i;break;} }
      var P=fach[iR], ab=Math.max(0,yB-KAMM), sy=272+ab*.5, sx=358+(sy-272)*.24, kamm;
      if(ab<3) kamm='C352 258 340 258 '+r1(P.x)+' '+r1(P.y);
      else kamm='C'+r1(sx-3)+' '+r1(sy-11)+' '+r1(sx-15)+' '+r1(sy-12)+' '+r1(sx-21)+' '+r1(sy-3)+'C'+r1(sx-27)+' '+r1(sy+8)+' '+r1(P.x+13)+' '+r1(P.y-16)+' '+r1(P.x+3.5)+' '+r1(P.y-5)+'Q'+r1(P.x+.6)+' '+r1(P.y-2)+' '+r1(P.x)+' '+r1(P.y);
      var linie=''; for(i=iR+1;i<=iLinks;i++) linie+='L'+r1(fach[i].x)+' '+r1(fach[i].y);
      var knD='M166 270C152 330 118 440 100 620L424 620C406 440 372 330 '+r1(sx)+' '+r1(sy)+kamm+linie+'C186 257 172 257 166 270Z';
      el.kn.setAttribute('d',knD); el.knMark.setAttribute('d',knD); el.knClip.setAttribute('d',knD); el.knRand.setAttribute('d',knD); el.knRand2.setAttribute('d',knD);
      el.pdl.setAttribute('points','0,'+KAMM+' 262,'+KAMM+' 262,'+r1(yB)+' 520,'+r1(yB)+' 520,620 0,620');
      var verlust=klemme((yB-KAMM-4)/14,0,1);
      if(verlust>0){
        var alt='M358 272C352 258 340 258 '+r1(fach[iGesund].x)+' '+r1(fach[iGesund].y);
        for(i=iGesund+1;i<=iR;i++) alt+='L'+r1(fach[i].x)+' '+r1(fach[i].y);
        el.knAlt.setAttribute('d',alt);
        attr(el.knZ,{d:'M'+r1(P.x+20)+' '+r1(P.y-(P.y-KAMM)*.45)+'L420 '+r1(yB+8)});
        attr(el.knT,{x:426,y:r1(yB+13)});
      }
      el.knAlt.setAttribute('opacity',r1(verlust*.9*100)/100); el.knH.setAttribute('opacity',r1(verlust*100)/100);

      // Zahnstein
      var st=klemme((d-3)/1.1,0,1), pl=klemme((d-2.2)/1.4,0,1);
      steine.forEach(function(q){ q.el.setAttribute('opacity', q.ueber ? r1(pl*.95*100)/100 : (q.y<yP-7 ? r1(st*klemme((yP-7-q.y)/8,0,1)*100)/100 : 0)); });

      // Sonde
      el.sonde.setAttribute('transform','translate('+r1(tx)+' '+r1(yP)+') rotate('+r1(Math.atan(tan)*180/Math.PI)+')');

      // Maß
      var mx=414, teile='M'+mx+' '+r1(YG)+'V'+r1(yP)+'M'+(mx-6)+' '+r1(YG)+'H'+(mx+6)+'M'+(mx-6)+' '+r1(yP)+'H'+(mx+6);
      for(var k=1;k<d-.05;k++) teile+='M'+mx+' '+r1(YG+k*S)+'h5';
      var pfad=el.mass.firstChild; if(!pfad){pfad=document.createElementNS(NS,'path');el.mass.appendChild(pfad);} pfad.setAttribute('d',teile);
      attr(el.randL,{x1:r1(xm+24+9*sw),y1:r1(YG),x2:mx+6,y2:r1(YG)});
      attr(el.massT,{x:mx+12,y:r1(Math.max(YG+17,(YG+yP)/2+7))});
      el.massT.textContent=d.toFixed(1).replace('.',',')+' mm';
    }

    var TEXTE=[
      ['PSI-Code 0 bis 2','Gesundes Zahnfleisch','Bis etwa 3 Millimeter ist normal. Das Zahnfleisch liegt fest am Zahn, das schwarze Band der Sonde bleibt über dem Rand sichtbar.'],
      ['PSI-Code 3','Zahnfleischtasche','Das Zahnfleisch hat sich vom Zahn gelöst und ist entzündet. In der Tasche sitzt Zahnstein, im Bild dunkel, und der Knochen beginnt zurückzugehen. Das schwarze Band taucht zum Teil ein: Jetzt lohnt eine genaue Untersuchung aller Zähne.'],
      ['PSI-Code 4','Tiefe Tasche','Das schwarze Band ist ganz unter dem Zahnfleischrand verschwunden. Der Knochen, der den Zahn hält, ist zurückgegangen. Die gestrichelte Linie zeigt, wo er vorher war. Meist ist jetzt eine systematische Behandlung nötig.']
    ];
    function text(d){
      var st=d<3.5?0:(d<=5.5?1:2), bf=$('#befund'), komma=d.toFixed(1).replace('.',',');
      $('#tiefe-wert').textContent=komma+' mm';
      if(+bf.dataset.stufe!==st+1||!bf.dataset.fertig){
        bf.dataset.stufe=st+1; bf.dataset.fertig='1';
        $('[data-code]',bf).textContent=TEXTE[st][0]; $('[data-titel]',bf).textContent=TEXTE[st][1]; $('[data-text]',bf).textContent=TEXTE[st][2];
      }
      regler.setAttribute('aria-valuetext',komma+' Millimeter, '+TEXTE[st][1]);
    }

    function ruhig(){return document.documentElement.dataset.ruhe==='1'||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}
    var ist=parseFloat(regler.value), soll=ist, lauf=null;
    function schritt(){
      var diff=soll-ist;
      if(Math.abs(diff)<.012||ruhig()){ist=soll;zeichne(ist);lauf=null;return;}
      ist+=diff*.09; zeichne(ist); lauf=requestAnimationFrame(schritt);
    }
    function setze(v){soll=v;text(v);if(!lauf) lauf=requestAnimationFrame(schritt);}
    regler.addEventListener('input',function(){stopp();setze(parseFloat(regler.value));});

    // Verlauf abspielen
    var knopf=$('#verlauf'), takt=null;
    function stopp(){ if(takt){clearInterval(takt);takt=null;} if(knopf){knopf.textContent='Verlauf abspielen';knopf.setAttribute('aria-pressed','false');} }
    if(knopf) knopf.addEventListener('click',function(){
      if(takt){stopp();return;}
      knopf.textContent='Anhalten'; knopf.setAttribute('aria-pressed','true');
      var v=1; regler.value=v; setze(v);
      takt=setInterval(function(){
        v+=ruhig()?2.5:.5; if(v>8){stopp();return;}
        regler.value=v; setze(v);
      },ruhig()?1600:650);
    });

    // schmale Bildschirme: Ausschnitt ohne Beschriftung links, Legende darunter
    function ausschnitt(){
      var eng=zahn.getBoundingClientRect().width<430;
      zahn.setAttribute('viewBox',eng?'110 20 410 585':'0 20 520 585');
      zahn.classList.toggle('eng',eng);
    }
    ausschnitt(); window.addEventListener('resize',ausschnitt);

    text(soll);
    if(!ruhig()&&'IntersectionObserver' in window){
      ist=.5; zeichne(ist);
      var einmal=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){einmal.disconnect(); if(!lauf) lauf=requestAnimationFrame(schritt);} });},{threshold:.35});
      einmal.observe(zahn);
    } else zeichne(ist);
  })();}

  /* ---------- Buchungsanleitung: Fragen, dann nur die passenden Schritte ---------- */
  var fw=$('#fallwahl'), anl=$('#anleitung');
  if(fw&&anl){(function(){
    var fragen={anliegen:$('[data-frage=anliegen]',fw),besuch:$('[data-frage=besuch]',fw),konto:$('[data-frage=konto]',fw)};
    var erg=$('#fall-ergebnis'), schritte=$$('.schritt',anl);
    function wert(n){var r=fw.querySelector('input[name=fall-'+n+']:checked');return r?r.value:'';}
    var TITEL={kontrolle:'Kontrolltermin online buchen',ueberweisung:'Termin mit Überweisung',schmerz:'Hilfe bei akuten Schmerzen'};
    function zeigen(){
      var a=wert('anliegen'), b=wert('besuch'), k=wert('konto');
      fragen.besuch.hidden=a!=='kontrolle';
      fragen.konto.hidden=!(a==='kontrolle'&&b);
      var fertig=(a==='kontrolle'&&b&&k)||a==='ueberweisung'||a==='schmerz';
      erg.hidden=!fertig; anl.hidden=!fertig;
      if(!fertig) return;
      var wahl=a==='kontrolle'?[a,b,k]:[a], n=0, bild=false;
      schritte.forEach(function(li){
        var ok=li.dataset.fall.split(' ').every(function(t){return wahl.indexOf(t)>-1;});
        li.hidden=!ok; if(ok){n++; if(li.querySelector('img')) bild=true;}
      });
      var zusatz=a==='kontrolle'?(b==='ja'?', schon Patientin oder Patient':', neu bei uns')+(k==='mit'?', mit CLICKDOC-Konto':', ohne CLICKDOC-Konto'):'';
      $('[data-fall-titel]',erg).textContent=TITEL[a];
      $('[data-fall-zahl]',erg).textContent=n+' Schritte'+(a==='kontrolle'?', mit Bildern':'');
      $('[data-anleitung-titel]',anl).textContent=TITEL[a]+zusatz;
      $('[data-fall-quelle]',anl).hidden=!bild;
    }
    $$('input[type=radio]',fw).forEach(function(r){r.addEventListener('change',zeigen);});
    $('#fall-neu').addEventListener('click',function(){
      $$('input[type=radio]',fw).forEach(function(r){r.checked=false;}); zeigen();
      fw.scrollIntoView({block:'start',behavior:document.documentElement.dataset.ruhe==='1'?'auto':'smooth'});
      var erste=fw.querySelector('input'); if(erste) erste.focus({preventScroll:true});
    });
    zeigen();
  })();}

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
