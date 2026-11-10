import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import * as THREE from "three";
import type {GameMode,PlayerSettings,RunResult} from "../types";
import {createBeachState,finishBeachMode,stepBeach,type BeachInput,type BeachState} from "../lib/beachSkate";

interface Props {
  mode:GameMode;
  onFinish:(result:RunResult)=>void;
  equippedItem?:string|null;
  controlScheme?:PlayerSettings["controlScheme"];
}
interface Pickup {mesh:THREE.Group;collected:boolean}
interface BoardModel {root:THREE.Group;wheels:THREE.Group[]}
interface RiderModel {root:THREE.Group;arms:THREE.Group[]}
const BOARD_WIDTH=9;
const BOARD_LENGTH=1300;
const standard=(color:number,roughness=0.78,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});

function texture(kind:"sand"|"wood"|"grip"):THREE.CanvasTexture {
  const canvas=document.createElement("canvas");
  canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext("2d");
  if(!ctx)return new THREE.CanvasTexture(canvas);
  if(kind==="sand") {
    ctx.fillStyle="#d9c49d";ctx.fillRect(0,0,512,512);
    for(let i=0;i<16000;i+=1){
      const shade=Math.floor(166+Math.random()*76);
      ctx.fillStyle="rgba("+shade+","+(shade-12)+","+(shade-34)+","+(0.08+Math.random()*0.22)+")";
      const size=Math.random()*1.5+0.25;
      ctx.fillRect(Math.random()*512,Math.random()*512,size,size);
    }
  } else if(kind==="wood") {
    ctx.fillStyle="#9f7956";ctx.fillRect(0,0,512,512);
    for(let row=0;row<18;row+=1){
      const y=row*29;
      ctx.fillStyle=row%2===0?"#b89169":"#a57e58";
      ctx.fillRect(0,y,512,27);
      ctx.strokeStyle="rgba(65,43,31,.23)";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(0,y+27);ctx.lineTo(512,y+27);ctx.stroke();
      for(let seam=row%2?84:0;seam<512;seam+=128){
        ctx.strokeStyle="rgba(58,39,29,.35)";
        ctx.beginPath();ctx.moveTo(seam,y+2);ctx.lineTo(seam,y+25);ctx.stroke();
      }
      for(let grain=0;grain<24;grain+=1){
        ctx.strokeStyle="rgba(73,48,31,.11)";
        const gx=Math.random()*512;
        ctx.beginPath();ctx.moveTo(gx,y+Math.random()*26);
        ctx.lineTo(gx+14+Math.random()*55,y+Math.random()*26);ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle="#242b2c";ctx.fillRect(0,0,512,512);
    for(let i=0;i<5000;i+=1){
      const shade=Math.floor(48+Math.random()*78);
      ctx.fillStyle="rgba("+shade+","+shade+","+shade+",.34)";
      ctx.fillRect(Math.random()*512,Math.random()*512,1,1);
    }
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=THREE.RepeatWrapping;map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
  if(kind==="wood")map.repeat.set(2,34);
  if(kind==="sand")map.repeat.set(8,48);
  return map;
}

function limb(parent:THREE.Group,start:THREE.Vector3,end:THREE.Vector3,radius:number,material:THREE.Material):THREE.Mesh {
  const delta=end.clone().sub(start);
  const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(radius,Math.max(0.02,delta.length()-2*radius),4,12),material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  return mesh;
}

function makeRider():RiderModel {
  const root=new THREE.Group();
  const skin=standard(0xb97e5a,0.9),shirt=standard(0xe8e0d1,0.92),shorts=standard(0x314b54,0.9);
  const hair=standard(0x38281f,0.95),helmet=standard(0xf1eee4,0.48),shoes=standard(0xe9e4d9,0.78),sole=standard(0x393c3e,0.95);
  const pelvis=new THREE.Mesh(new THREE.CapsuleGeometry(0.2,0.16,4,12),shorts);
  pelvis.position.set(0,0.84,0);pelvis.castShadow=true;root.add(pelvis);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(0.235,0.47,5,16),shirt);
  torso.position.set(0,1.22,0.045);torso.rotation.x=0.12;torso.castShadow=true;root.add(torso);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.085,0.11,16),skin);
  neck.position.set(0,1.54,0.02);root.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.153,24,18),skin);
  head.position.set(0,1.76,0);head.castShadow=true;root.add(head);
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(0.159,20,12,0,Math.PI*2,0,Math.PI*0.52),hair);
  hairCap.position.set(0,1.8,0.012);root.add(hairCap);
  const helmetShell=new THREE.Mesh(new THREE.SphereGeometry(0.176,24,16,0,Math.PI*2,0,Math.PI*0.53),helmet);
  helmetShell.position.set(0,1.88,0.005);helmetShell.castShadow=true;root.add(helmetShell);
  const helmetRim=new THREE.Mesh(new THREE.TorusGeometry(0.151,0.012,7,32),standard(0xb9b9b0,0.55,0.1));
  helmetRim.rotation.x=Math.PI/2;helmetRim.position.set(0,1.87,0.005);root.add(helmetRim);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(0.035,12,10),skin);
  nose.scale.set(0.75,0.7,0.65);nose.position.set(0,1.75,-0.145);root.add(nose);
  const eyes=standard(0x302923,0.6);
  for(const side of [-1,1]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.012,8,8),eyes);
    eye.position.set(side*0.052,1.785,-0.143);root.add(eye);
  }
  const arms:THREE.Group[]=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*0.225,1.35,0);
    limb(arm,new THREE.Vector3(0,0,0),new THREE.Vector3(side*0.09,-0.19,-0.07),0.078,shirt);
    limb(arm,new THREE.Vector3(side*0.09,-0.19,-0.07),new THREE.Vector3(side*0.19,-0.36,-0.23),0.056,skin);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(0.06,12,10),skin);
    hand.position.set(side*0.19,-0.38,-0.24);arm.add(hand);root.add(arm);arms.push(arm);
  }
  for(const side of [-1,1]){
    const legGroup=new THREE.Group();legGroup.position.set(side*0.12,0.83,side*0.19);
    limb(legGroup,new THREE.Vector3(0,0,0),new THREE.Vector3(side*0.015,-0.23,-0.07),0.095,shorts);
    limb(legGroup,new THREE.Vector3(side*0.015,-0.23,-0.07),new THREE.Vector3(side*0.025,-0.43,0.08),0.063,skin);
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.09,0.29),shoes);
    shoe.position.set(side*0.025,-0.46,-0.025);shoe.castShadow=true;legGroup.add(shoe);
    const outsole=new THREE.Mesh(new THREE.BoxGeometry(0.165,0.035,0.3),sole);
    outsole.position.set(side*0.025,-0.515,-0.025);legGroup.add(outsole);root.add(legGroup);
  }
  return {root,arms};
}

function makeBoard(equippedItem:string|null):BoardModel {
  const root=new THREE.Group();
  const boardColor=equippedItem==="solar-board"?0xd9824d:equippedItem==="aqua-trail"?0x4caaa0:0xb57b4e;
  const shape=new THREE.Shape(),hw=0.16,hl=0.55,r=0.105;
  shape.moveTo(-hw+r,-hl);shape.lineTo(hw-r,-hl);shape.quadraticCurveTo(hw,-hl,hw,-hl+r);
  shape.lineTo(hw,hl-r);shape.quadraticCurveTo(hw,hl,hw-r,hl);shape.lineTo(-hw+r,hl);
  shape.quadraticCurveTo(-hw,hl,-hw,hl-r);shape.lineTo(-hw,-hl+r);
  shape.quadraticCurveTo(-hw,-hl,-hw+r,-hl);
  const deckGeometry=new THREE.ExtrudeGeometry(shape,{depth:0.07,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:0.014,bevelThickness:0.012});
  deckGeometry.rotateX(-Math.PI/2);
  const deck=new THREE.Mesh(deckGeometry,new THREE.MeshStandardMaterial({color:boardColor,roughness:0.55,metalness:0.06}));
  deck.position.y=0.235;deck.castShadow=true;deck.receiveShadow=true;root.add(deck);
  const grip=new THREE.Mesh(new THREE.ShapeGeometry(shape,16),new THREE.MeshStandardMaterial({map:texture("grip"),roughness:0.98}));
  grip.rotation.x=-Math.PI/2;grip.position.y=0.309;root.add(grip);
  for(const side of [-1,1]){
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.008,0.68),standard(equippedItem==="solar-board"?0xffe1bd:0x94e2d5,0.5));
    stripe.position.set(side*0.105,0.315,0);root.add(stripe);
  }
  const wheels:THREE.Group[]=[];
  const truck= new THREE.MeshStandardMaterial({color:0x959b9c,roughness:0.32,metalness:0.85});
  const dark= new THREE.MeshStandardMaterial({color:0x4b5255,roughness:0.55,metalness:0.72});
  const tire= new THREE.MeshStandardMaterial({color:0x262b2d,roughness:0.76});
  const hub= new THREE.MeshStandardMaterial({color:0xd7d7d0,roughness:0.28,metalness:0.9});
  for(const z of [-0.37,0.37]){
    const base=new THREE.Mesh(new THREE.BoxGeometry(0.31,0.035,0.16),dark);base.position.set(0,0.218,z);root.add(base);
    const hanger=new THREE.Mesh(new THREE.CylinderGeometry(0.027,0.027,0.39,14),truck);
    hanger.rotation.z=Math.PI/2;hanger.position.set(0,0.16,z);root.add(hanger);
    for(const side of [-1,1]){
      const wheel=new THREE.Group();wheel.position.set(side*0.215,0.125,z);
      const rubber=new THREE.Mesh(new THREE.CylinderGeometry(0.078,0.078,0.055,24),tire);
      rubber.rotation.z=Math.PI/2;rubber.castShadow=true;wheel.add(rubber);
      const centre=new THREE.Mesh(new THREE.CylinderGeometry(0.034,0.034,0.058,18),hub);
      centre.rotation.z=Math.PI/2;wheel.add(centre);
      const axle=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.061,12),dark);
      axle.rotation.z=Math.PI/2;wheel.add(axle);root.add(wheel);wheels.push(wheel);
    }
  }
  return {root,wheels};
}

function makeShell():THREE.Group {
  const shell=new THREE.Group();
  const material=new THREE.MeshPhysicalMaterial({color:0xe8c9a1,roughness:0.34,metalness:0.04,clearcoat:0.65,clearcoatRoughness:0.22});
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.14,20,14),material);
  body.scale.set(0.82,0.52,1.18);body.rotation.x=-0.2;body.castShadow=true;shell.add(body);
  for(let index=-2;index<=2;index+=1){
    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(index*0.025,0.005,-0.075),
      new THREE.Vector3(index*0.035,0.045,0),
      new THREE.Vector3(index*0.015,0.015,0.08),
    ]);
    shell.add(new THREE.Mesh(new THREE.TubeGeometry(curve,10,0.004,5,false),standard(0xffe5c1,0.5)));
  }
  return shell;
}

function addUmbrella(scene:THREE.Scene,x:number,z:number,color:number):void {
  const group=new THREE.Group();
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.035,1.75,10),standard(0xd4d0c4,0.58,0.35));
  pole.position.y=0.88;group.add(pole);
  const canopy=new THREE.Mesh(new THREE.ConeGeometry(1.02,0.42,12),new THREE.MeshStandardMaterial({color,roughness:0.82,side:THREE.DoubleSide}));
  canopy.position.y=1.88;canopy.castShadow=true;group.add(canopy);
  group.position.set(x,-0.02,z);scene.add(group);
}

function addPalm(scene:THREE.Scene,x:number,z:number,scale:number):void {
  const points=[
    new THREE.Vector3(x,0,z),
    new THREE.Vector3(x+0.12*scale,1.2*scale,z+0.08*scale),
    new THREE.Vector3(x+0.25*scale,2.5*scale,z+0.12*scale),
    new THREE.Vector3(x+0.45*scale,3.7*scale,z+0.18*scale),
  ];
  const trunk=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),22,0.17*scale,8,false),standard(0x8c6540,0.95));
  trunk.castShadow=true;scene.add(trunk);
  const crown=points[points.length-1];
  const leaves=new THREE.MeshStandardMaterial({color:0x47765a,roughness:0.92,side:THREE.DoubleSide});
  for(let index=0;index<7;index+=1){
    const angle=index/7*Math.PI*2;
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),leaves);
    leaf.scale.set(0.16*scale,0.075*scale,1.55*scale);
    leaf.position.set(crown.x+Math.cos(angle)*0.78*scale,crown.y-0.18*scale,crown.z+Math.sin(angle)*0.72*scale);
    leaf.rotation.y=-angle;leaf.rotation.x=-0.18;leaf.castShadow=true;scene.add(leaf);
  }
}

function makeBeach(scene:THREE.Scene):{water:THREE.BufferGeometry;base:Float32Array;pickups:Pickup[]} {
  const sand=new THREE.Mesh(new THREE.PlaneGeometry(160,BOARD_LENGTH),new THREE.MeshStandardMaterial({map:texture("sand"),roughness:1}));
  sand.rotation.x=-Math.PI/2;sand.position.set(0,-0.12,-BOARD_LENGTH/2+30);sand.receiveShadow=true;scene.add(sand);
  const deck=new THREE.Mesh(new THREE.PlaneGeometry(BOARD_WIDTH,BOARD_LENGTH),new THREE.MeshStandardMaterial({map:texture("wood"),roughness:0.88}));
  deck.rotation.x=-Math.PI/2;deck.position.set(0,0.015,-BOARD_LENGTH/2+30);deck.receiveShadow=true;scene.add(deck);
  const edgeMaterial=standard(0x806347,0.93);
  for(const side of [-1,1]){
    const edge=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,BOARD_LENGTH),edgeMaterial);
    edge.position.set(side*BOARD_WIDTH/2,0.01,-BOARD_LENGTH/2+30);scene.add(edge);
  }

  const waterGeometry=new THREE.PlaneGeometry(60,BOARD_LENGTH,36,150);
  waterGeometry.rotateX(-Math.PI/2);
  const base=Float32Array.from(waterGeometry.attributes.position.array as ArrayLike<number>);
  const water=new THREE.Mesh(waterGeometry,new THREE.MeshPhysicalMaterial({color:0x3b9ea0,roughness:0.2,metalness:0.06,clearcoat:0.95,clearcoatRoughness:0.18}));
  water.position.set(-39,-0.13,-BOARD_LENGTH/2+30);scene.add(water);
  const foamMaterial=new THREE.MeshBasicMaterial({color:0xd7f1e8,transparent:true,opacity:0.48});
  for(let index=0;index<22;index+=1){
    const foam=new THREE.Mesh(new THREE.BoxGeometry(0.16+(index%4)*0.08,0.012,4+(index%3)),foamMaterial);
    foam.position.set(-9.5-(index%2)*0.5,-0.06,-index*54-6);foam.rotation.y=(index%2?1:-1)*0.08;scene.add(foam);
  }

  const umbrellaColors=[0x4a835e,0x3e7556,0xe5a26e,0xe8d2a0];
  for(let index=0;index<7;index+=1){
    const z=-32-index*155;
    addPalm(scene,10+(index%2)*1.5,z,0.9+(index%2)*0.12);
    addPalm(scene,-10-(index%2)*1.1,z-70,0.68+(index%2)*0.08);
    addUmbrella(scene,6.8,z-25,umbrellaColors[index%4]);
    addUmbrella(scene,-7.2,z-110,umbrellaColors[(index+2)%4]);
  }

  const benchWood=standard(0x856347,0.86),benchMetal=standard(0x555f61,0.52,0.6);
  for(let index=0;index<14;index+=1){
    const z=-50-index*82,bench=new THREE.Group();
    const seat=new THREE.Mesh(new THREE.BoxGeometry(1.35,0.09,0.34),benchWood);seat.position.y=0.54;bench.add(seat);
    const back=new THREE.Mesh(new THREE.BoxGeometry(1.35,0.37,0.07),benchWood);back.position.set(0,0.77,0.14);bench.add(back);
    for(const side of [-1,1]){
      const leg=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.53,0.28),benchMetal);
      leg.position.set(side*0.52,0.27,0);bench.add(leg);
    }
    bench.position.set(index%2?5.8:-5.9,0,z);
    bench.traverse(object=>{if(object instanceof THREE.Mesh)object.castShadow=true;});scene.add(bench);
  }

  const prototype=makeShell(),pickups:Pickup[]=[];
  let seed=7123;
  const random=()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};
  for(let index=0;index<48;index+=1){
    const shell=prototype.clone(true),lane=[-2.65,0,2.65][index%3];
    shell.position.set(lane+(random()-0.5)*0.35,0.53,-20-index*19);
    shell.rotation.y=random()*Math.PI*2;
    scene.add(shell);pickups.push({mesh:shell,collected:false});
  }
  return {water:waterGeometry,base,pickups};
}

export default function BeachSkate3D({
  mode,onFinish,equippedItem=null,controlScheme="arrows",
}:Props) {
  const hostRef=useRef<HTMLDivElement>(null);
  const inputRef=useRef<BeachInput>({left:false,right:false,accelerate:false,brake:false});
  const pausedRef=useRef(false),finishedRef=useRef(false);
  const finishRef=useRef(onFinish);finishRef.current=onFinish;
  const [paused,setPaused]=useState(false);
  const [webglUnsupported,setWebglUnsupported]=useState(false);
  const [hud,setHud]=useState({score:0,shells:0,distance:0,speed:16,timeLeft:90});

  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    let renderer:THREE.WebGLRenderer;
    try {
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
    } catch {
      setWebglUnsupported(true);return;
    }
    setWebglUnsupported(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.12;
    renderer.domElement.className="beach-skate-canvas";
    renderer.domElement.setAttribute("aria-label","Three-dimensional beach skateboard game");
    host.replaceChildren(renderer.domElement);

    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xb8dbe3);
    scene.fog=new THREE.Fog(0xb8dbe3,75,255);
    const camera=new THREE.PerspectiveCamera(47,16/9,0.1,500);
    camera.position.set(4.7,4,8.2);
    scene.add(new THREE.HemisphereLight(0xd8efff,0xb99a73,1.65));
    const sun=new THREE.DirectionalLight(0xffe2bd,3);
    sun.position.set(-18,28,14);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);
    sun.shadow.camera.near=0.5;sun.shadow.camera.far=95;
    const shadowCam=sun.shadow.camera as THREE.OrthographicCamera;
    shadowCam.left=-24;shadowCam.right=24;shadowCam.top=25;shadowCam.bottom=-25;
    sun.shadow.bias=-0.00018;sun.shadow.normalBias=0.025;scene.add(sun);scene.add(sun.target);

    const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(7,24,20),new THREE.MeshBasicMaterial({color:0xffe7c2}));
    sunDisc.position.set(-63,28,-175);scene.add(sunDisc);
    const cloudMaterial=new THREE.MeshStandardMaterial({color:0xf4f4ed,roughness:1});
    for(let index=0;index<7;index+=1){
      const cloud=new THREE.Group();
      for(let part=0;part<4;part+=1){
        const puff=new THREE.Mesh(new THREE.SphereGeometry(2.1+part%2,16,12),cloudMaterial);
        puff.scale.set(1.45,0.55,0.78);puff.position.set(part*2.2-3.1,part%2?0.5:0,0);cloud.add(puff);
      }
      cloud.position.set(-48+index*16,20+(index%3)*3,-115-(index%4)*43);scene.add(cloud);
    }

    const environment=makeBeach(scene);
    const player=new THREE.Group(),board=makeBoard(equippedItem),rider=makeRider();
    player.add(board.root);player.add(rider.root);scene.add(player);
    const state:{current:BeachState}={current:createBeachState()};
    const pressed=inputRef.current;
    pausedRef.current=false;finishedRef.current=false;setPaused(false);

    const resize=()=>{
      const width=Math.max(320,host.clientWidth),height=Math.max(260,host.clientHeight);
      camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
    };
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    const setPause=(next:boolean)=>{
      if(finishedRef.current)return;pausedRef.current=next;setPaused(next);
    };
    const leftKey=(event:KeyboardEvent)=>controlScheme==="arrows"?event.key==="ArrowLeft":event.key.toLowerCase()==="a";
    const rightKey=(event:KeyboardEvent)=>controlScheme==="arrows"?event.key==="ArrowRight":event.key.toLowerCase()==="d";
    const accelKey=(event:KeyboardEvent)=>controlScheme==="arrows"?event.key==="ArrowUp"||event.code==="Space":event.key.toLowerCase()==="w"||event.code==="Space";
    const brakeKey=(event:KeyboardEvent)=>controlScheme==="arrows"?event.key==="ArrowDown":event.key.toLowerCase()==="s";
    const down=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();setPause(!pausedRef.current);return;}
      if(leftKey(event))pressed.left=true;
      if(rightKey(event))pressed.right=true;
      if(accelKey(event))pressed.accelerate=true;
      if(brakeKey(event))pressed.brake=true;
      if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(event.key))event.preventDefault();
    };
    const up=(event:KeyboardEvent)=>{
      if(leftKey(event))pressed.left=false;
      if(rightKey(event))pressed.right=false;
      if(accelKey(event))pressed.accelerate=false;
      if(brakeKey(event))pressed.brake=false;
    };
    const clear=()=>{pressed.left=false;pressed.right=false;pressed.accelerate=false;pressed.brake=false;};
    window.addEventListener("keydown",down,{passive:false});
    window.addEventListener("keyup",up);
    window.addEventListener("blur",clear);

    let frame=0,lastTime=performance.now(),lastHud=0;
    const targetPos=new THREE.Vector3(),lookPos=new THREE.Vector3();
    const animate=(now:number)=>{
      frame=requestAnimationFrame(animate);
      const dt=Math.min(Math.max((now-lastTime)/1000,0),0.05);lastTime=now;
      if(!pausedRef.current&&!finishedRef.current){
        state.current=stepBeach(state.current,pressed,dt);
        const current=state.current,time=now*0.001,progress=current.distance;
        player.position.set(current.x,0.015,-progress);
        board.root.rotation.z=-current.lateralVelocity*0.018;
        board.root.rotation.x=Math.sin(time*2.1)*0.006;
        rider.root.position.y=Math.sin(time*5.1)*0.012;
        rider.root.rotation.z=-current.lateralVelocity*0.012;
        rider.arms[0].rotation.z=0.12+Math.sin(time*2.3)*0.045;
        rider.arms[1].rotation.z=-0.12-Math.sin(time*2.3)*0.045;
        for(const wheel of board.wheels)wheel.rotateX(current.speed*dt/0.078);

        const waterPos=environment.water.attributes.position as THREE.BufferAttribute;
        for(let index=0;index<waterPos.count;index+=1){
          const offset=index*3,x=environment.base[offset],z=environment.base[offset+2];
          const wave=Math.sin(x*0.23+time*1.25)*0.035+Math.sin(z*0.11-time*0.78)*0.024;
          waterPos.setY(index,environment.base[offset+1]+wave);
        }
        waterPos.needsUpdate=true;

        for(const pickup of environment.pickups){
          if(pickup.collected)continue;
          pickup.mesh.rotation.y+=dt*0.72;
          pickup.mesh.position.y=0.53+Math.sin(time*2.4+pickup.mesh.position.z)*0.045;
          if(Math.abs(pickup.mesh.position.z+progress)<1.05&&Math.abs(pickup.mesh.position.x-current.x)<0.78){
            pickup.collected=true;current.shells+=1;current.score+=85;scene.remove(pickup.mesh);
          }
        }
        const finish=finishBeachMode(
          mode==="shell-collector"?"shell-collector":mode==="time-trial"?"time-trial":"classic",
          current.elapsed,current.shells,
        );
        if(finish){
          finishedRef.current=true;
          finishRef.current({
            gameId:"wakeboard-x",
            score:Math.floor(current.score+finish.bonusPoints),
            coins:current.shells*3+finish.bonusCoins,
            shells:current.shells,
            distance:Math.floor(current.distance),
            duration:Math.floor(current.elapsed),
          });
        }
        if(now-lastHud>120){
          const duration=mode==="time-trial"?60:90;
          setHud({
            score:Math.floor(current.score),shells:current.shells,distance:Math.floor(current.distance),
            speed:Math.round(current.speed*3.6),timeLeft:Math.max(0,Math.ceil(duration-current.elapsed)),
          });
          lastHud=now;
        }
      }
      const progress=state.current.distance;
      targetPos.set(state.current.x+4.6,3.7,-progress+7.8);
      camera.position.lerp(targetPos,0.075);
      lookPos.set(state.current.x,1.1,-progress-3.2);
      camera.lookAt(lookPos);
      sun.target.position.set(state.current.x,0,-progress-25);
      renderer.render(scene,camera);
    };
    frame=requestAnimationFrame(animate);

    return ()=>{
      cancelAnimationFrame(frame);observer.disconnect();
      window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",clear);clear();
      scene.traverse(object=>{
        if(object instanceof THREE.Mesh){
          object.geometry.dispose();
          const materials=Array.isArray(object.material)?object.material:[object.material];
          for(const material of materials){
            for(const value of Object.values(material))if(value instanceof THREE.Texture)value.dispose();
            material.dispose();
          }
        }
      });
      renderer.dispose();renderer.domElement.remove();
    };
  },[mode,equippedItem,controlScheme]);

  const hold=(field:keyof BeachInput)=>({
    onPointerDown:(event:ReactPointerEvent<HTMLButtonElement>)=>{
      event.preventDefault();inputRef.current[field]=true;event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerUp:(event:ReactPointerEvent<HTMLButtonElement>)=>{event.preventDefault();inputRef.current[field]=false;},
    onPointerCancel:()=>{inputRef.current[field]=false;},
    onLostPointerCapture:()=>{inputRef.current[field]=false;},
  });
  const pauseGame=()=>{
    if(finishedRef.current)return;
    pausedRef.current=!pausedRef.current;setPaused(pausedRef.current);
  };
  const durationLabel=mode==="time-trial"?"GOLDEN HOUR":mode==="shell-collector"?"SHELL ROUTE":"BEACH CRUISE";

  return (
    <div className="beach-skate-shell">
      <div className="beach-skate-viewport" ref={hostRef}/>
      {webglUnsupported&&<div className="beach-webgl-fallback"><strong>3D GRAPHICS UNAVAILABLE</strong><span>This browser could not start WebGL. Try enabling hardware acceleration or updating the browser.</span></div>}
      <div className="beach-skate-hud">
        <div className="beach-hud-brand"><span>COASTLINE SKATE</span><small>3D BEACH SESSION / {durationLabel}</small></div>
        <div className="beach-hud-stats">
          <div><small>SCORE</small><strong>{hud.score.toLocaleString()}</strong></div>
          <div><small>SHELLS</small><strong>{hud.shells}{mode==="shell-collector"?" / 12":""}</strong></div>
          <div><small>DISTANCE</small><strong>{hud.distance} m</strong></div>
          <div><small>SPEED</small><strong>{hud.speed} km/h</strong></div>
          {mode!=="classic"&&<div><small>TIME</small><strong>{hud.timeLeft}s</strong></div>}
        </div>
      </div>
      <button type="button" className="beach-pause-button" onClick={pauseGame} aria-pressed={paused}>{paused?"RESUME":"PAUSE"}</button>
      {paused&&<div className="beach-pause-layer"><span>SESSION PAUSED</span><button type="button" onClick={pauseGame}>CONTINUE RIDE</button></div>}
      <div className="beach-skate-touch-controls" aria-label="Touch skateboard controls">
        <button type="button" {...hold("left")} aria-label="Steer left">←</button>
        <button type="button" {...hold("brake")} aria-label="Brake">BRAKE</button>
        <button type="button" className="beach-push-button" {...hold("accelerate")} aria-label="Push forward">PUSH</button>
        <button type="button" {...hold("right")} aria-label="Steer right">→</button>
      </div>
    </div>
  );
}
