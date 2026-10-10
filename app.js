/* Static presentation of locked Stage 04 evidence: no analytical recalculation. */
(async () => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const esc = (x) => String(x ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const label = { ELIGIBLE_ONSHORE:'Confirmed Niger Delta onshore location', OFFSHORE_SCREENING:'Offshore record (not in the closer study)', AMBIGUOUS_CONFLICT:'Uncertain onshore/offshore classification', OTHER_NIGERIAN_ONSHORE:'Recorded outside the Niger Delta study area' };
  const app = { sites: [], markers: new Map(), map: null, cluster: null, boundary: null, viewMode: 'all', selectedId: null, visibleLimit: 12 };
  const type = s => s.watchlist_recent_high_shorter_history ? 'watch' : s.abatement_priority_display === 'HIGH' ? 'high' : s.abatement_priority_display === 'ELEVATED' ? 'elevated' : s.eligibility_class === 'OFFSHORE_SCREENING' ? 'offshore' : s.eligibility_class === 'AMBIGUOUS_CONFLICT' ? 'conflict' : s.eligibility_class === 'OTHER_NIGERIAN_ONSHORE' ? 'other' : 'eligible';
  const assessed = n => n !== null && n !== undefined && Number.isFinite(Number(n));
  const volume = n => assessed(n) ? `${fmt.format(Number(n))} million m³` : 'Not studied for this location';
  const quantity = (n, unit = '') => assessed(n) ? `${fmt.format(Number(n))}${unit}` : 'Not assessed';
  function readableGroup(s) { return s.watchlist_recent_high_shorter_history ? 'Recent activity to watch' : s.abatement_priority_display === 'HIGH' ? 'First group for flare-reduction checks' : s.abatement_priority_display === 'ELEVATED' ? 'Second group for flare-reduction checks' : s.eligibility_class === 'ELIGIBLE_ONSHORE' ? 'Not in the first two flare-reduction groups' : 'Not included in the closer study'; }
  function siteName(s) {
    if (s.eligibility_class === 'ELIGIBLE_ONSHORE' && s.assigned_state) return s.assigned_state + ' State';
    if (s.eligibility_class === 'OFFSHORE_SCREENING') return 'Offshore location';
    if (s.eligibility_class === 'AMBIGUOUS_CONFLICT') return 'Location with uncertain classification';
    if (s.eligibility_class === 'OTHER_NIGERIAN_ONSHORE') return (s.matched_adm1_names || 'Other Nigerian location') + ' — outside study area';
    return 'Recorded location';
  }
  function siteTags(s) {
    const tags = [];
    if (s.watchlist_recent_high_shorter_history) tags.push('Recent activity to watch');
    else if (s.abatement_priority_display === 'HIGH') tags.push('First flare-reduction group');
    else if (s.abatement_priority_display === 'ELEVATED') tags.push('Second flare-reduction group');
    if (s.community_monitoring_candidate) tags.push('Community-monitoring checks');
    if (s.ecosystem_monitoring_candidate) tags.push('Mangrove-monitoring checks');
    return tags.length ? tags : [s.eligibility_class === 'ELIGIBLE_ONSHORE' ? 'Other confirmed onshore location' : label[s.eligibility_class] || 'Other recorded location'];
  }
  const tagsHTML = s => siteTags(s).map(t => '<span class="site-tag">' + esc(t) + '</span>').join('');
  const markerIcon = (s, selected = false) => L.divIcon({className:'',html:'<i class="marker-dot marker-' + type(s) + (selected ? ' marker-selected' : '') + '"></i>',iconSize:selected?[22,22]:[16,16],iconAnchor:selected?[11,11]:[8,8]});
  function popup(s) {
    return '<div class="site-popup"><h3>' + esc(siteName(s)) + '</h3><p class="site-ref">Site ID: ' + esc(s.id) + '</p><p><b>' + esc(readableGroup(s)) + '</b></p><p>Estimated gas burned, 2012–2025: ' + esc(volume(s.cumulative_estimated_volume_million_m3)) + '</p><button type="button" class="text-button" data-details="' + esc(s.id) + '">View location details →</button></div>';
  }
  function detail(s) {
    $('#selection-count').textContent = 'Selected';
    $('#clear-selection').hidden = false;
    const studied = s.eligibility_class === 'ELIGIBLE_ONSHORE';
    const context = studied ? '<dt>Nearby people (2020 model)</dt><dd>' + (assessed(s.population_count_5km_corrected) ? int.format(Number(s.population_count_5km_corrected)) + ' within 5 km' : 'Not available') + '</dd><dt>Nearby mapped mangroves (2021)</dt><dd>' + (assessed(s.mangrove_area_2km_m2) ? fmt.format(Number(s.mangrove_area_2km_m2) / 1000000) + ' km² within 2 km' : 'Not available') + '</dd><dt>Community-monitoring shortlist?</dt><dd>' + (s.community_monitoring_candidate ? 'Selected for further checks' : 'Not on this shortlist') + '</dd><dt>Mangrove-monitoring shortlist?</dt><dd>' + (s.ecosystem_monitoring_candidate ? 'Selected for further checks' : 'Not on this shortlist') + '</dd>' : '';
    const note = studied ? 'These are screening estimates, not proof of damage or pollution exposure. Community and mangrove checks are separate from the flare-reduction groups.' : 'This record remains in the full inventory, but is outside the 372-location onshore study. Detailed site comparisons were not made here.';
    $('#site-detail').innerHTML = '<p class="site-kicker">CURRENT SELECTION</p><h3>' + esc(siteName(s)) + '</h3><p class="site-ref">Site ID: ' + esc(s.id) + '</p><div class="site-tags">' + tagsHTML(s) + '</div><dl class="detail-grid"><dt>Estimated gas burned (2012–2025)</dt><dd>' + esc(volume(s.cumulative_estimated_volume_million_m3)) + '</dd><dt>Estimated gas burned (2023–2025)</dt><dd>' + esc(volume(s.recent_2023_2025_sum_million_m3)) + '</dd><dt>Years with positive estimates</dt><dd>' + (assessed(s.positive_volume_years) ? s.positive_volume_years + ' of 14' : 'Not studied') + '</dd>' + context + '</dl><p class="detail-caution">' + esc(note) + '</p><details class="site-technical"><summary>Technical details</summary><p>Source longitude, latitude: ' + Number(s.source_lon).toFixed(6) + ', ' + Number(s.source_lat).toFixed(6) + '</p><p>Official study group: ' + esc(s.abatement_priority_display || 'Not assigned') + '</p><p>' + esc(s.watchlist_recent_high_shorter_history ? 'Separate recent-high, shorter-history watchlist; not reclassified.' : s.abatement_rationale || 'Original inventory record retained.') + '</p></details>';
  }
  function clearSelection() {
    if (app.selectedId && app.markers.has(app.selectedId)) {
      const prior = app.sites.find(x => x.id === app.selectedId);
      if (prior) app.markers.get(prior.id).setIcon(markerIcon(prior));
    }
    app.selectedId = null;
    if (app.map) app.map.closePopup();
    $('#selection-count').textContent = 'No selection yet';
    $('#clear-selection').hidden = true;
    $('#site-detail').innerHTML = '<p>Select a dot on the map or a location below to see what was recorded there.</p>';
    document.querySelectorAll('#site-list [data-focus]').forEach(button => {
      button.classList.remove('is-selected');
      button.setAttribute('aria-pressed', 'false');
    });
  }
  function selectSite(s, scrollDetails = false) {
    if (!s) return;
    if (app.selectedId && app.selectedId !== s.id && app.markers.has(app.selectedId)) {
      const prior = app.sites.find(x => x.id === app.selectedId);
      if (prior) app.markers.get(prior.id).setIcon(markerIcon(prior));
    }
    app.selectedId = s.id;
    const current = app.markers.get(s.id);
    if (current) current.setIcon(markerIcon(s, true));
    detail(s);
    document.querySelectorAll('#site-list [data-focus]').forEach(b => {
      const selected = b.dataset.focus === s.id;
      b.classList.toggle('is-selected', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    if (scrollDetails && window.matchMedia('(max-width: 800px)').matches) $('#site-detail').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function focus(id, zoom = 10, scrollDetails = false) {
    const s = app.sites.find(x => x.id === id);
    if (!s || !app.map) return;
    selectSite(s, scrollDetails); // Update the information immediately, before any cluster zoom callback.
    const m = app.markers.get(id);
    app.map.setView([s.source_lat, s.source_lon], zoom);
    if (m && app.cluster && typeof app.cluster.zoomToShowLayer === 'function') {
      app.cluster.zoomToShowLayer(m, () => { if (app.selectedId === id) m.openPopup(); });
    } else if (m) m.openPopup();
  }
  function filtered(s) { 
    if (app.viewMode === 'reduce' && !['HIGH','ELEVATED'].includes(s.abatement_priority_display)) return false;
    if (app.viewMode === 'people' && !s.community_monitoring_candidate) return false;
    if (app.viewMode === 'nature' && !s.ecosystem_monitoring_candidate) return false;
    if (app.viewMode === 'watch' && !s.watchlist_recent_high_shorter_history) return false;
    const query=$('#site-search').value.trim().toLowerCase(); if(query && ![s.id,s.assigned_state,siteName(s)].some(v=>String(v||'').toLowerCase().includes(query))) return false;
    const a=$('#state').value,c=$('#class').value,t=$('#tier').value,p=$('#persistence').value,r=$('#recent').value; const pos=Number(s.positive_volume_years), recent=Number(s.recent_2023_2025_sum_million_m3); if(a!=='ALL'&&s.assigned_state!==a)return false; if(c!=='ALL'&&s.eligibility_class!==c)return false; if(t==='WATCHLIST'?!s.watchlist_recent_high_shorter_history:t!=='ALL'&&s.abatement_priority_display!==t)return false; if(p==='10'&&(!assessed(s.positive_volume_years)||pos<10))return false;if(p==='1'&&(!assessed(s.positive_volume_years)||pos<1))return false;if(p==='0'&&(!assessed(s.positive_volume_years)||s.eligibility_class!=='ELIGIBLE_ONSHORE'||pos!==0))return false;if(r==='P75'&&(!assessed(s.recent_2023_2025_sum_million_m3)||recent<12.287063))return false;if(r==='P90'&&(!assessed(s.recent_2023_2025_sum_million_m3)||recent<72.498311))return false;if(r==='ZERO'&&(!assessed(s.recent_2023_2025_sum_million_m3)||s.eligibility_class!=='ELIGIBLE_ONSHORE'||recent!==0))return false;if($('#community').checked&&!s.community_monitoring_candidate)return false;if($('#ecosystem').checked&&!s.ecosystem_monitoring_candidate)return false;return true; }
  function apply() {
    const rows=app.sites.filter(filtered);
    if (app.selectedId && !rows.some(s=>s.id===app.selectedId)) clearSelection();
    app.cluster.clearLayers();
    rows.forEach(s=>app.cluster.addLayer(app.markers.get(s.id)));
    $('#shown').textContent=rows.length;
    $('#filter-note').textContent='';
    const showing=Math.min(rows.length,app.visibleLimit);
    $('#site-list-count').textContent='Showing '+showing+' of '+rows.length+' locations';
    $('#site-list').innerHTML=rows.slice(0,app.visibleLimit).map(s=>
      '<button type="button" class="site-row'+(app.selectedId===s.id?' is-selected':'')+'" data-focus="'+esc(s.id)+'" aria-pressed="'+(app.selectedId===s.id)+'"><span class="site-row-title"><i class="marker-dot marker-'+type(s)+'" aria-hidden="true"></i><b>'+esc(siteName(s))+'</b></span><span class="site-row-sub">'+esc(siteTags(s).join(' · '))+'</span><small>Site ID: '+esc(s.id)+'</small></button>'
    ).join('') || '<p class="empty-sites">No locations match. Clear the search or choose another map view.</p>';
    const more=$('#show-more');
    more.hidden=rows.length<=app.visibleLimit;
    if(!more.hidden) more.textContent='Show '+Math.min(12,rows.length-app.visibleLimit)+' more locations';
  }
  function updateViewButtons() { document.querySelectorAll('.quick-view').forEach(button => { const on = button.dataset.view === app.viewMode; button.classList.toggle('is-active', on); button.setAttribute('aria-pressed', String(on)); }); }
  function resetAdvancedFilters() { document.querySelectorAll('.filters select').forEach(x=>x.value='ALL'); document.querySelectorAll('.filters input').forEach(x=>x.checked=false); }
  function chooseView(view) { app.viewMode = view; app.visibleLimit=12; $('#site-search').value=''; resetAdvancedFilters(); updateViewButtons(); apply(); }
  function annualChart(rows) { const w=760,h=300,p={l:58,r:18,t:18,b:34},vals=rows.map(x=>+x.volume_total_million_m3),max=Math.max(...vals)*1.08,x=i=>p.l+i*(w-p.l-p.r)/(rows.length-1),y=v=>h-p.b-v/max*(h-p.t-p.b),grid=[0,.25,.5,.75,1].map(f=>`<line x1="${p.l}" y1="${y(max*f)}" x2="${w-p.r}" y2="${y(max*f)}" stroke="#d6dedc"/><text x="${p.l-7}" y="${y(max*f)+4}" font-size="10" text-anchor="end" fill="#57707a">${fmt.format(max*f)}</text>`).join(''),path=rows.map((r,i)=>`${i?'L':'M'}${x(i)},${y(+r.volume_total_million_m3)}`).join(' '); $('#annual-chart').innerHTML=`<svg viewBox="0 0 ${w} ${h}"><title>Annual estimated flare volume, eligible onshore sites</title>${grid}<path d="${path}" fill="none" stroke="#008c8a" stroke-width="3"/>${rows.map((r,i)=>`<circle cx="${x(i)}" cy="${y(+r.volume_total_million_m3)}" r="4" fill="#153e5b"><title>${r.year}: ${volume(r.volume_total_million_m3)}</title></circle>${(i%2===0||i===rows.length-1)?`<text x="${x(i)}" y="${h-12}" font-size="10" text-anchor="middle" fill="#57707a">${r.year}</text>`:''}`).join('')}</svg>`; }
  function bars(rows) { const names=['Abia','Akwa Ibom','Bayelsa','Cross River','Delta','Edo','Imo','Ondo','Rivers'],by=new Map(rows.map(r=>[r.assigned_state_if_defensible,r])),full=names.map(n=>by.get(n)||{assigned_state:n,unique_sites:0,total_estimated_volume_million_m3:0}),max=Math.max(...full.map(r=>+r.total_estimated_volume_million_m3)); $('#state-chart').innerHTML=full.map(r=>`<div class="bar"><span>${esc(r.assigned_state_if_defensible || r.assigned_state)}</span><i style="width:${max?+r.total_estimated_volume_million_m3/max*100:0}%"></i><em>${fmt.format(+r.total_estimated_volume_million_m3)}</em></div>`).join(''); }
  try { const [sites,boundary,dash]=await Promise.all(['data/sites_476.json','data/niger_delta_nine_states.geojson','data/dashboard.json'].map(x=>fetch(x).then(r=>{if(!r.ok)throw new Error('Failed to load '+x+' (HTTP '+r.status+')');return r.json();}))); app.sites=sites; [...new Set(sites.map(s=>s.assigned_state).filter(Boolean))].sort().forEach(n=>$('#state').insertAdjacentHTML('beforeend',`<option value="${esc(n)}">${esc(n)}</option>`)); annualChart(dash.annual_eligible_onshore);bars(dash.state_summary);if(typeof L==='undefined')throw new Error('Leaflet map library is unavailable.');app.map=L.map('map',{attributionControl:false,preferCanvas:true});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(app.map);app.boundary=L.geoJSON(boundary,{style:{color:'#426c78',weight:1.6,fillColor:'#dce6e3',fillOpacity:.25}}).addTo(app.map);app.map.fitBounds(app.boundary.getBounds(),{padding:[20,20]});app.map.on('click',e=>{
    // Marker/cluster clicks should select or zoom, not dismiss the detail panel.
    const target=e.originalEvent&&e.originalEvent.target;
    if(target&&typeof target.closest==='function'&&target.closest('.leaflet-marker-icon, .leaflet-popup, .leaflet-control'))return;
    clearSelection(); // Empty-map clicks dismiss the selection without changing the map view or filters.
  });L.control.attribution({prefix:false}).addAttribution('Boundaries: geoBoundaries gbOpen / GRID3 (CC BY 4.0)').addTo(app.map);let hasClusterPlugin=typeof L.markerClusterGroup==='function';if(hasClusterPlugin){try{app.cluster=L.markerClusterGroup({showCoverageOnHover:false,spiderfyOnMaxZoom:true,disableClusteringAtZoom:11,chunkedLoading:true,maxClusterRadius:44}).addTo(app.map);}catch(clusterError){console.warn('Marker cluster initialization failed; falling back to regular markers.',clusterError);hasClusterPlugin=false;}}if(!hasClusterPlugin){app.cluster=L.layerGroup().addTo(app.map);const n=$('.map-note');n.textContent='Site markers remain available individually. Marker clustering is unavailable in this browser; zoom in to inspect dense locations. The original site coordinates are preserved. s_38320 lies beyond the initial regional extent.';console.warn('Using native Leaflet marker layer.');}sites.forEach(s=>{const m=L.marker([s.source_lat,s.source_lon],{title:`${s.id}: ${label[s.eligibility_class]}`,icon:markerIcon(s)}).bindPopup(popup(s));m.on('click',()=>selectSite(s));app.markers.set(s.id,m);});document.querySelectorAll('.filters select,.filters input').forEach(e=>e.addEventListener('change',()=>{app.viewMode='custom';app.visibleLimit=12;updateViewButtons();apply();}));$('#site-search').addEventListener('input',()=>{app.visibleLimit=12;apply();});$('#show-more').addEventListener('click',()=>{app.visibleLimit+=12;apply();});document.querySelectorAll('.quick-view').forEach(b=>b.addEventListener('click',()=>chooseView(b.dataset.view)));$('#reset').addEventListener('click',()=>{clearSelection();chooseView('all');app.map.fitBounds(app.boundary.getBounds(),{padding:[20,20]});});$('#clear-selection').addEventListener('click',clearSelection);$('#focus-offframe').addEventListener('click',()=>{$('#reset').click();$('#class').value='OTHER_NIGERIAN_ONSHORE';apply();focus('s_38320',7);});document.addEventListener('click',e=>{const d=e.target.closest('[data-details]');if(d){selectSite(app.sites.find(s=>s.id===d.dataset.details),true);return;}const b=e.target.closest('[data-focus]');if(b)focus(b.dataset.focus,10,true);});$('#menu').addEventListener('click',()=>{const open=$('#mobile-nav').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));});updateViewButtons();apply(); } catch(e) { console.error('Atlas initialization failed:',e);$('#site-detail').innerHTML='<p><b>The evidence explorer could not finish loading.</b> Refresh this page. If the issue continues, check that map scripts and data files are accessible. <small>'+esc(e.message||'Unknown loading error')+'</small></p>'; }
})();
