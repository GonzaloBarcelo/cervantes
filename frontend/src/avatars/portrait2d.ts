import { es as t } from '../i18n';
import { AnimatedAvatar, type Frame } from './base';

// Original vector painting. Separate face, eyes and mouth make animation rig-independent.
export class Portrait2D extends AnimatedAvatar {
  private face!: SVGGElement;
  private mouth!: SVGEllipseElement;
  private eyes!: SVGGElement[];
  private pupils!: SVGGElement;
  private brow!: SVGGElement;
  protected create() {
    this.container.innerHTML = `<svg class="portrait" viewBox="0 0 600 680" role="img" aria-label="${t.portraitAria}">
    <defs>
      <radialGradient id="back"><stop stop-color="#806142"/><stop offset=".58" stop-color="#403d2c"/><stop offset="1" stop-color="#20281f"/></radialGradient>
      <linearGradient id="skin" x1="0" x2="1" y2=".3"><stop stop-color="#edc38e"/><stop offset=".45" stop-color="#c39a69"/><stop offset="1" stop-color="#735a3d"/></linearGradient>
      <linearGradient id="coat" x2="1" y2="1"><stop stop-color="#343830"/><stop offset=".55" stop-color="#1c211e"/><stop offset="1" stop-color="#0f1716"/></linearGradient>
      <linearGradient id="beard" x2="1" y2="1"><stop stop-color="#b1aa92"/><stop offset=".5" stop-color="#716d59"/><stop offset="1" stop-color="#393c32"/></linearGradient>
      <linearGradient id="ruff"><stop stop-color="#e3d9bd"/><stop offset=".5" stop-color="#b9b59d"/><stop offset="1" stop-color="#6e7663"/></linearGradient>
      <radialGradient id="light"><stop stop-color="#f0c582" stop-opacity=".15"/><stop offset="1" stop-color="#d8a765" stop-opacity="0"/></radialGradient>
      <filter id="grain"><feTurbulence baseFrequency=".68" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".065"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter>
    </defs>
    <path fill="url(#back)" d="M0 0h600v680H0z"/>
    <path d="M22 0h48v680H22M532 0h48v680h-48" fill="#a89864" opacity=".06"/>
    <ellipse cx="210" cy="210" rx="255" ry="290" fill="url(#light)"/>
    <g filter="url(#grain)">
      <path d="M53 680Q62 496 152 472L220 445h153l79 35q102 39 106 200" fill="url(#coat)"/>
      <path d="M172 497L122 675M422 496l52 177M196 554l19 126M396 542l-8 138" fill="none" stroke="#7a785c" stroke-width="2" opacity=".25"/>
      <path d="M288 546l7 134" stroke="#bc9870" opacity=".38"/>
      <g fill="#9d8a5a"><circle cx="302" cy="587" r="4"/><circle cx="304" cy="622" r="4"/><circle cx="306" cy="658" r="4"/></g>
      <g data-face>
      <path d="M248 382l-15 82 67 41 74-46-23-85" fill="url(#skin)"/>
      <path d="M167 446q40-23 63-10 64 69 146-1 39 1 66 22l-42 74q-83 69-181-1z" fill="url(#ruff)"/>
      ${Array.from({length:25},(_,i)=>{const x=178+i*10.6;return `<path d="M${x} ${446+Math.sin(i/24*Math.PI)*40}l${(12-i)*1.1} ${44+Math.sin(i/24*Math.PI)*18} 7-8" fill="none" stroke="${i%2?'#faf0d3':'#697663'}" stroke-width="4" opacity=".68"/>`;}).join('')}
      <path d="M194 250q-19-119 40-148 63-38 124-4 68 10 58 151l-29 42-172-2" fill="#373b31"/>
      <path d="M207 243q-29-18-31 18t32 54M388 243q29-18 30 18t-31 54" fill="url(#skin)" stroke="#775c3b" stroke-width="3"/>
      <path d="M218 166q78-53 164 1l9 104-16 84q-22 68-75 69-57-1-78-66l-17-79z" fill="url(#skin)"/>
      <path d="M214 215q-10-35 8-61 38-46 100-39-20 20-17 32-54-14-91 68M350 131q63 30 45 110l-21-65z" fill="#626250"/>
      ${Array.from({length:12},(_,i)=>`<path d="M${219+i*9} ${154-i*.9}q8-22 28-28" fill="none" stroke="#a29a7d" stroke-width="2" opacity=".4"/>`).join('')}
      <path d="M236 203q51-16 102-3M241 211q39-10 75-3" stroke="#8e6d46" opacity=".55" fill="none" stroke-width="2"/>
      <g data-brow fill="none" stroke="#57533d" stroke-width="7" stroke-linecap="round"><path d="M228 234q22-13 44 0"/><path d="M326 231q24-12 43 2"/></g>
      <g data-eye transform="translate(251 252)"><path d="M-23 0q22-15 45 0-23 12-45 0" fill="#d3c7a4"/><path d="M-23 0q22-15 45 0" fill="none" stroke="#614f36" stroke-width="3"/></g>
      <g data-eye transform="translate(345 250)"><path d="M-22 0q22-14 43 0-21 12-43 0" fill="#c5b692"/><path d="M-22 0q22-14 43 0" fill="none" stroke="#554832" stroke-width="3"/></g>
      <g data-pupils><g fill="#3c3825"><ellipse cx="252" cy="251" rx="7" ry="8"/><ellipse cx="345" cy="249" rx="7" ry="8"/></g><g fill="#eadcaa"><circle cx="250" cy="248" r="2"/><circle cx="343" cy="246" r="2"/></g></g>
      <path d="M291 242l-13 61q14 14 33 2" fill="none" stroke="#86603d" stroke-width="4" stroke-linecap="round"/>
      <path d="M293 256l-2 37" stroke="#e8ba81" stroke-width="5" opacity=".6"/>
      <path d="M223 275q7 17 24 13M345 284q18 4 30-13" fill="none" stroke="#ac8052" stroke-width="2"/>
      <path d="M219 302q12 40 24 35l31 13 50-3q42-4 56-45-3 109-77 141-71-19-84-141" fill="url(#beard)"/>
      <path d="M266 349q35-15 67 0l-5 23q-25 12-57-1z" fill="#a9845b"/>
      <ellipse data-mouth cx="298" cy="359" rx="28" ry="3" fill="#382820" stroke="#9d7052" stroke-width="3"/>
      <path d="M291 318q-23-7-51 26 26 8 50-9l9-9 9 9q26 13 46 4-25-26-47-21z" fill="#85816a"/>
      <path d="M244 340q29-2 44-13M308 326q19 8 39 9" fill="none" stroke="#c4b69a" stroke-width="2" opacity=".7"/>
      ${Array.from({length:19},(_,i)=>`<path d="M${231+i*7} ${368+Math.sin(i)*6}q4 25 ${(9-i)*2} ${39-Math.abs(i-9)*2}" fill="none" stroke="${i%2?'#b4ab8c':'#4a5041'}" stroke-width="2" opacity=".58"/>`).join('')}
      </g>
      <path d="M48 636q48-7 107 10l4 34H46z" fill="#161f1b" opacity=".65"/>
    </g>
    <path d="M0 0h600v680H0z" fill="none" stroke="#d1b06e" stroke-opacity=".15" stroke-width="2"/>
    </svg>`;
    this.face = this.container.querySelector('[data-face]')!;
    this.mouth = this.container.querySelector('[data-mouth]')!;
    this.eyes = [...this.container.querySelectorAll<SVGGElement>('[data-eye]')];
    this.pupils = this.container.querySelector('[data-pupils]')!;
    this.brow = this.container.querySelector('[data-brow]')!;
  }
  protected draw(f: Frame) {
    this.face.style.transformOrigin = '300px 470px';
    this.face.style.transform = `translate(${f.x*3}px,${Math.sin(f.time*1.6)*1.6+f.energy*1.5}px) rotate(${Math.sin(f.time*.43)*.35+f.x*.6}deg)`;
    this.mouth.setAttribute('ry', String(2+f.open*15));
    this.mouth.setAttribute('rx', String(25+f.wide*6-f.round*13));
    this.eyes.forEach((eye,i)=>eye.setAttribute('transform',`translate(${i?345:251} ${i?250:252}) scale(1 ${Math.max(.07,1-f.blink)})`));
    this.pupils.style.opacity = String(1-f.blink);
    this.pupils.setAttribute('transform', `translate(${f.x*4+Math.sin(f.time*.8)*.6} ${f.y*3})`);
    this.brow.setAttribute('transform',`translate(0 ${f.mood==='ironic'?-3:f.mood==='serious'?2:0})`);
  }
}
