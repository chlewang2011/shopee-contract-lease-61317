/* Normalized points survive mobile rotation without changing the signature. */
function createSignatureEditor(canvas, onChange) {
  const pad=new SignaturePad(canvas,{minWidth:1,maxWidth:2.5,minDistance:2});
  let width=0,height=0;
  const strokes=()=>pad.toData().map(g=>g.points.map(p=>[
    Math.max(0,Math.min(1,Number((p.x/width).toFixed(5)))),
    Math.max(0,Math.min(1,Number((p.y/height).toFixed(5))))
  ])).filter(s=>s.length>1);
  function resize() {
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const old=width?strokes():[];
    width=rect.width;height=rect.height;
    const ratio=Math.max(window.devicePixelRatio||1,1);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    canvas.getContext('2d').scale(ratio,ratio);
    pad.clear();
    pad.fromData(old.map(s=>({penColor:'#111111',minWidth:1,maxWidth:2.5,velocityFilterWeight:0.7,compositeOperation:'source-over',points:s.map(([x,y],i)=>({x:x*width,y:y*height,time:i*16,pressure:0.5}))})));
  }
  new ResizeObserver(resize).observe(canvas);
  pad.addEventListener('endStroke',onChange);
  return {strokes,clear(){pad.clear();},setEnabled(enabled){enabled?pad.on():pad.off();}};
}
function signatureImage(strokes) {
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=320;
  const ctx=canvas.getContext('2d');ctx.strokeStyle='#111';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';
  for(const stroke of strokes){ctx.beginPath();stroke.forEach(([x,y],i)=>i?ctx.lineTo(x*800,y*320):ctx.moveTo(x*800,y*320));ctx.stroke();}
  return canvas.toDataURL('image/png');
}
