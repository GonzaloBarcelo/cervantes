import { es as t } from '../i18n';
import * as THREE from 'three';
import { AnimatedAvatar, type Frame } from './base';

// Original procedural sculpture, with a deliberately small ARKit-compatible rig.
// It can be replaced by a licensed GLB without changing the AvatarModule contract.
export class Bust3D extends AnimatedAvatar {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35,1,.1,30);
  private renderer!: THREE.WebGLRenderer;
  private head = new THREE.Group();
  private body = new THREE.Group();
  private mouth!: THREE.Mesh;
  private face!: THREE.Mesh;
  private lids: THREE.Mesh[] = [];
  private pupils: THREE.Mesh[] = [];
  private brows: THREE.Mesh[] = [];
  private observer!: ResizeObserver;
  private geometry = new THREE.SphereGeometry(1,40,32);
  private materials: THREE.Material[] = [];
  private material(color: string, roughness=.8, metalness=.03) {const m=new THREE.MeshStandardMaterial({color,roughness,metalness});this.materials.push(m);return m;}
  private ellipsoid(parent: THREE.Object3D, material: THREE.Material, position: number[], scale: number[]) {
    const mesh = new THREE.Mesh(this.geometry,material);mesh.position.set(position[0],position[1],position[2]);mesh.scale.set(scale[0],scale[1],scale[2]);parent.add(mesh);return mesh;
  }
  private morph(mesh:THREE.Mesh, names:string[], transform:(name:string,x:number,y:number,z:number)=>number[]) {
    const geometry=mesh.geometry.clone();const positions=geometry.attributes.position;
    geometry.morphAttributes.position=names.map(name=>{const data=new Float32Array(positions.count*3);for(let i=0;i<positions.count;i++){const p=transform(name,positions.getX(i),positions.getY(i),positions.getZ(i));data.set(p,i*3);}return new THREE.Float32BufferAttribute(data,3);});
    geometry.morphTargetsRelative=false;mesh.geometry=geometry;mesh.updateMorphTargets();mesh.morphTargetDictionary=Object.fromEntries(names.map((n,i)=>[n,i]));
  }
  private weight(mesh:THREE.Mesh,name:string,value:number){mesh.morphTargetInfluences![mesh.morphTargetDictionary![name]]=value;}
  protected create() {
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x283024,1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    this.container.replaceChildren(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label',t.bustAria);
    this.camera.position.set(0,.35,5.9);this.camera.lookAt(0,.2,0);
    this.scene.add(new THREE.HemisphereLight(0xf4e5c4,0x25322b,2));
    const key=new THREE.DirectionalLight(0xffd5a0,4);key.position.set(-3,4,4);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0x95ab9b,2);rim.position.set(3,2,-2);this.scene.add(rim);
    const skin=this.material('#b59a72'), hair=this.material('#655f4d'), robe=this.material('#303a30'), ruff=this.material('#d3ceb4'), dark=this.material('#282b22'), eye=this.material('#cfc3a2');
    this.scene.add(this.body);this.body.add(this.head);
    this.ellipsoid(this.body,robe,[0,-1.04,-.14],[1.15,.72,.5]);
    this.ellipsoid(this.body,skin,[0,-.35,0],[.31,.5,.28]);
    this.face=this.ellipsoid(this.head,skin,[0,.57,0],[.61,.87,.47]);
    this.morph(this.face,['jawOpen','mouthSmileLeft','mouthSmileRight'],(name,x,y,z)=>[x,y-(name==='jawOpen'?Math.max(0,-y)*.10:0),z]);
    // Hair swept back around the temples, exposing a high forehead.
    this.ellipsoid(this.head,hair,[0,1.14,-.11],[.62,.37,.42]);
    for(const side of [-1,1]){
      this.ellipsoid(this.head,hair,[side*.51,.75,-.13],[.13,.54,.34]);
      this.ellipsoid(this.head,skin,[side*.61,.55,-.015],[.11,.23,.12]);
      const brow=this.ellipsoid(this.head,hair,[side*.245,.83,.427],[.185,.045,.051]);brow.rotation.z=side*.10;this.brows.push(brow);
      this.ellipsoid(this.head,dark,[side*.24,.696,.431],[.16,.081,.055]);
      const lid=this.ellipsoid(this.head,eye,[side*.24,.7,.459],[.145,.062,.035]);
      this.morph(lid,[side<0?'eyeBlinkLeft':'eyeBlinkRight'],(_n,x,y,z)=>[x,y*.04,z]);this.lids.push(lid);
      const pupil=this.ellipsoid(this.head,dark,[side*.235,.698,.492],[.047,.05,.022]);this.pupils.push(pupil);
      this.ellipsoid(this.head,eye,[side*.235-.012,.715,.512],[.01,.011,.007]);
      this.ellipsoid(this.head,skin,[side*.34,.41,.325],[.2,.21,.12]);
      const moustache=this.ellipsoid(this.head,hair,[side*.17,.18,.482],[.205,.073,.075]);moustache.rotation.z=side*-.21;
    }
    this.ellipsoid(this.head,skin,[0,.51,.486],[.089,.246,.13]);
    this.ellipsoid(this.head,skin,[0,.336,.568],[.122,.077,.104]);
    this.ellipsoid(this.head,hair,[0,-.12,.19],[.38,.3,.31]);
    for(let i=0;i<17;i++){const a=i/16*Math.PI;const x=Math.cos(a)*.40,y=.14-Math.sin(a)*.28;const tuft=this.ellipsoid(this.head,hair,[x,y,.37],[.078,.21,.09]);tuft.rotation.z=(a-Math.PI/2)*.25;}
    this.mouth=this.ellipsoid(this.head,dark,[0,.075,.48],[.18,.018,.035]);
    this.morph(this.mouth,['jawOpen','mouthFunnel','mouthSmileLeft','mouthSmileRight'],(name,x,y,z)=>[x*(name==='mouthFunnel'?.52:name.startsWith('mouthSmile')?1.15:1),y*(name==='jawOpen'?6:1),z]);
    for(let i=0;i<36;i++){const a=i/36*Math.PI*2;const fold=this.ellipsoid(this.body,ruff,[Math.cos(a)*.5,-.49+Math.sin(a)*.035,Math.sin(a)*.35],[.083,.14,.24]);fold.rotation.y=-a;fold.rotation.z=Math.cos(a)*.42;}
    for(let i=0;i<3;i++)this.ellipsoid(this.body,this.material('#8f7850',.5,.5),[0,-.95-i*.21,.361],[.025,.025,.018]);
    const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.62,.69,.17,64),this.material('#555745'));pedestal.position.y=-1.67;this.body.add(pedestal);
    this.observer=new ResizeObserver(()=>{const w=this.container.clientWidth,h=this.container.clientHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();});this.observer.observe(this.container);
  }
  protected draw(f:Frame) {
    this.head.rotation.set(f.y*.045+Math.sin(f.time*1.1)*.008+f.energy*.015,f.x*.12+Math.sin(f.time*.35)*.012,Math.sin(f.time*.5)*.009);
    this.body.position.y=Math.sin(f.time*1.5)*.008;
    this.weight(this.face,'jawOpen',f.open);
    this.weight(this.mouth,'jawOpen',f.open);
    this.weight(this.mouth,'mouthFunnel',f.round);
    this.weight(this.mouth,'mouthSmileLeft',f.wide*.5);
    this.weight(this.mouth,'mouthSmileRight',f.wide*.5);
    this.lids.forEach((lid,i)=>{this.weight(lid,i===0?'eyeBlinkLeft':'eyeBlinkRight',f.blink);this.pupils[i].scale.y=.05*(1-f.blink*.95);this.pupils[i].position.x=(i===0?-.235:.235)+f.x*.025+Math.sin(f.time*.8)*.004;});
    this.brows.forEach((b,i)=>b.rotation.z=(i===0?-1:1)*(.10+(f.mood==='serious'?.13:f.mood==='ironic'?-.10:0)));
    this.renderer.render(this.scene,this.camera);
  }
  protected cleanup() {this.observer?.disconnect();this.scene.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.geometry.dispose();});this.materials.forEach(m=>m.dispose());this.renderer?.dispose();this.renderer?.forceContextLoss();}
}
