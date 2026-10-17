// QA overlay of the three zones (DIRECTION §5.3). On only for QA stills:
// add ?safe=1 to the page URL (beats.mjs does).
(function (K) {
  K.safezone = function (stage) {
    if (!/[?&]safe=1/.test(location.search)) return null;
    const o = document.createElement('div');
    o.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9999;';
    o.innerHTML = `
      <div style="position:absolute;left:0;top:0;width:1080px;height:288px;background:rgba(255,0,80,.10)"></div>
      <div style="position:absolute;left:0;top:1248px;width:1080px;height:672px;background:rgba(255,0,80,.10)"></div>
      <div style="position:absolute;left:888px;top:288px;width:192px;height:960px;background:rgba(255,0,80,.10)"></div>
      <div style="position:absolute;left:0;top:288px;width:72px;height:960px;background:rgba(255,0,80,.10)"></div>
      <div style="position:absolute;left:72px;top:288px;width:816px;height:960px;outline:3px dashed rgba(255,0,80,.75)"></div>
      <div style="position:absolute;left:108px;top:200px;width:864px;height:1300px;outline:2px dotted rgba(0,120,255,.6)"></div>`;
    stage.appendChild(o);
    return o;
  };
})((window.Kit = window.Kit || {}));
